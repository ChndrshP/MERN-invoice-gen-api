import { Request, Response } from "express";
import puppeteer from "puppeteer";
import { Buffer } from 'buffer';

interface Product {
  name: string;
  price: number;
  quantity: number;
}

interface CustomerDetails {
  name: string;
  email: string;
  date: string;
}

interface InvoiceData {
  customer: CustomerDetails;
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
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice Generator</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: white;
                color: #333;
            }
            .invoice {
                max-width: 800px;
                margin: 0 auto;
                background: white;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 40px;
                padding-bottom: 20px;
                border-bottom: 1px solid #eee;
            }
            .header h1 {
                font-size: 24px;
                margin: 0;
                color: #333;
            }
            .logo {
                height: 40px;
            }
            .logo img {
                height: 100%;
            }
            .customer-details {
                background-color: #1a1f36;
                color: white;
                padding: 30px;
                border-radius: 10px;
                margin-bottom: 30px;
            }
            .customer-name {
                color: #a5f3fc;
                font-size: 18px;
                margin-bottom: 10px;
            }
            .customer-email {
                color: #94a3b8;
            }
            .customer-date {
                position: absolute;
                top: 30px;
                right: 30px;
                color: white;
            }
            .table-header {
                display: grid;
                grid-template-columns: 2fr 1fr 1fr 1fr;
                background: linear-gradient(90deg, #1e293b 0%, #374151 100%);
                color: white;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 10px;
            }
            .products {
                margin-bottom: 40px;
            }
            .product-row {
                display: grid;
                grid-template-columns: 2fr 1fr 1fr 1fr;
                padding: 15px;
                border-bottom: 1px solid #eee;
            }
            .amount-section {
                width: 300px;
                margin-left: auto;
                background: white;
                border-radius: 10px;
                padding: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            .amount-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
            }
            .total-amount {
                font-weight: bold;
                color: #1e293b;
                border-top: 1px solid #eee;
                padding-top: 10px;
            }
            .footer {
                margin-top: 60px;
                padding: 20px;
                background: #1a1f36;
                color: #94a3b8;
                border-radius: 10px;
                text-align: center;
                font-size: 14px;
                line-height: 1.5;
            }
            .date {
                color: #94a3b8;
                margin-top: 40px;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="invoice">
            <div class="header">
                <h1>INVOICE GENERATOR</h1>
                <div class="logo">
                    <svg viewBox="0 0 24 24" width="40" height="40">
                        <path fill="#1a1f36" d="M12 0L24 12L12 24L0 12L12 0Z"/>
                    </svg>
                    Levitation
                </div>
            </div>

            <div class="customer-details">
                <div class="customer-name">${data.customer.name}</div>
                <div class="customer-email">${data.customer.email}</div>
                <div class="customer-date">Date: ${data.customer.date}</div>
            </div>

            <div class="products">
                <div class="table-header">
                    <div>Product</div>
                    <div>Qty</div>
                    <div>Rate</div>
                    <div>Total Amount</div>
                </div>
                ${data.products.map(product => `
                    <div class="product-row">
                        <div>${product.name}</div>
                        <div>${product.quantity}</div>
                        <div>${product.rate}</div>
                        <div>USD ${(product.quantity * product.rate).toFixed(2)}</div>
                    </div>
                `).join('')}
            </div>

            <div class="amount-section">
                <div class="amount-row">
                    <span>Total Charges</span>
                    <span>$${subtotal.toFixed(2)}</span>
                </div>
                <div class="amount-row">
                    <span>GST (18%)</span>
                    <span>$${gst.toFixed(2)}</span>
                </div>
                <div class="amount-row total-amount">
                    <span>Total Amount</span>
                    <span>₹ ${finalTotal.toFixed(2)}</span>
                </div>
            </div>

            <div class="date">
                Date: ${data.customer.date}
            </div>

            <div class="footer">
                We are pleased to provide any further information you may require and look forward to assisting with your next order. Rest assured, it will receive our prompt and dedicated attention.
            </div>
        </div>
    </body>
    </html>
  `;

    // Launch browser with minimal settings
    const browser = await puppeteer.launch({
      executablePath: '/opt/render/.cache/puppeteer/chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
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