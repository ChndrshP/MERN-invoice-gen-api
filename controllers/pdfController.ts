import { Request, Response } from "express";
import puppeteer from "puppeteer";
import { Buffer } from 'buffer';

interface Product {
  name: string;
  price: number;
  quantity: number;
}

interface InvoiceData {
  products: Product[];
  total: number;
  gst: number;
}

export const generatePDF = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Request body received:', JSON.stringify(req.body, null, 2));

    const { products, total, gst }: InvoiceData = req.body;

    // Calculate totals
    const subtotal = products.reduce((sum: number, product: Product): number => 
      sum + (product.price * product.quantity), 0);
    
    if (Math.abs(subtotal - total) > 0.01) {
      res.status(400).json({ 
        error: "Total amount doesn't match the sum of products",
        expected: subtotal,
        received: total
      });
      return;
    }

    const finalTotal = subtotal + gst;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @page {
            margin: 20px;
            size: A4;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            padding: 20px;
            margin: 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            page-break-inside: avoid;
          }
          th, td {
            padding: 12px 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          .total-row td {
            font-weight: bold;
            border-top: 2px solid #000;
          }
          .amount {
            text-align: right;
          }
        </style>
      </head>
      <body>
        <h1>Invoice</h1>
        <table>
          <thead>
            <tr>
              <th>Product Name</th>
              <th class="amount">Quantity</th>
              <th class="amount">Price (₹)</th>
              <th class="amount">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${products.map((product: Product) => `
              <tr>
                <td>${product.name}</td>
                <td class="amount">${product.quantity}</td>
                <td class="amount">${product.price.toFixed(2)}</td>
                <td class="amount">${(product.quantity * product.price).toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr>
              <td colspan="3">Subtotal</td>
              <td class="amount">${subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="3">GST (18%)</td>
              <td class="amount">${gst.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="3">Final Total</td>
              <td class="amount">${finalTotal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    // Launch browser with minimal settings
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    
    // Basic viewport settings
    await page.setViewport({ 
      width: 800, 
      height: 600
    });

    // Set content with minimal wait condition
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0'
    });

    // Generate PDF with minimal settings
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true
    });

    // Close the browser before sending response
    await browser.close();

    // Stream the response instead of sending buffer directly
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=invoice.pdf',
      'Content-Length': pdfBuffer.length
    });

    // Create a readable stream from the buffer and pipe it to the response
    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(pdfBuffer);
    bufferStream.pipe(res);

  } catch (error) {
    console.error('PDF Generation Error:', error);
    
    // Make sure we don't send headers if we've already started the response
    if (!res.headersSent) {
      res.status(500).json({
        error: "PDF generation failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};