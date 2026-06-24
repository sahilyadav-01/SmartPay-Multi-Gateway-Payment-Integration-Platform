const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a PDF Invoice for an Order and save it to the invoices/ folder.
 * @param {Object} order - Order object from database populated with items
 * @param {Object} transaction - Transaction object containing payment ID and gateway
 * @param {Object} user - User object containing email/name
 * @returns {Promise<string>} - Absolute path to the generated PDF file
 */
const generateInvoice = (order, transaction, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const invoiceDir = path.join(__dirname, '../../invoices');
      
      // Ensure the invoices directory exists
      if (!fs.existsSync(invoiceDir)) {
        fs.mkdirSync(invoiceDir, { recursive: true });
      }

      const fileName = `invoice_${order._id}.pdf`;
      const filePath = path.join(invoiceDir, fileName);
      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      // Header Banner
      doc.fillColor('#1a1a2e')
         .rect(0, 0, 612, 100)
         .fill();

      // Brand Title
      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(24)
         .text('SmartPay LLC', 50, 35);
      
      doc.fontSize(10)
         .font('Helvetica')
         .text('Multi-Gateway Payment Integration System', 50, 65);

      // Invoice metadata
      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(16)
         .text('INVOICE', 450, 35, { align: 'right' });
      
      doc.fontSize(10)
         .font('Helvetica')
         .text(`Invoice ID: ${order._id.toString().substring(0, 8).toUpperCase()}`, 450, 55, { align: 'right' })
         .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 450, 70, { align: 'right' });

      // Reset text spacing
      doc.fillColor('#333333');

      // Bill To details
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('Bill To:', 50, 130);
      
      doc.fontSize(10)
         .font('Helvetica')
         .text(`Name: ${user.name}`, 50, 150)
         .text(`Email: ${user.email}`, 50, 165)
         .text(`Phone: ${user.phone || 'N/A'}`, 50, 180);

      // Payment Details
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('Payment Info:', 350, 130);
      
      doc.fontSize(10)
         .font('Helvetica')
         .text(`Gateway: ${(transaction ? transaction.gateway : 'N/A').toUpperCase()}`, 350, 150)
         .text(`Transaction ID: ${transaction ? transaction.transactionId : 'N/A'}`, 350, 165)
         .text(`Status: ${order.status.toUpperCase()}`, 350, 180);

      // Draw table header
      let y = 230;
      doc.rect(50, y, 512, 20).fill('#f2f2f5');
      
      doc.fillColor('#1a1a2e')
         .font('Helvetica-Bold')
         .fontSize(10)
         .text('Item Description', 60, y + 5)
         .text('Qty', 320, y + 5, { width: 30, align: 'center' })
         .text('Unit Price', 380, y + 5, { width: 80, align: 'right' })
         .text('Total', 480, y + 5, { width: 80, align: 'right' });

      doc.fillColor('#333333');
      doc.font('Helvetica');
      
      // Items list
      order.items.forEach((item) => {
        y += 25;
        doc.text(item.name, 60, y)
           .text(item.quantity.toString(), 320, y, { width: 30, align: 'center' })
           .text(`$${item.price.toFixed(2)}`, 380, y, { width: 80, align: 'right' })
           .text(`$${(item.quantity * item.price).toFixed(2)}`, 480, y, { width: 80, align: 'right' });
        
        // Draw line
        doc.moveTo(50, y + 18).lineTo(562, y + 18).strokeColor('#e5e5ea').lineWidth(1).stroke();
      });

      // Total Calculations
      y += 35;
      const subtotal = order.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      const gst = subtotal * 0.18; // 18% GST standard simulation
      const finalAmount = subtotal + gst - (order.discount || 0);

      doc.fontSize(10).font('Helvetica');
      
      doc.text('Subtotal:', 380, y, { width: 80, align: 'right' })
         .text(`$${subtotal.toFixed(2)}`, 480, y, { width: 80, align: 'right' });

      y += 18;
      doc.text('GST (18%):', 380, y, { width: 80, align: 'right' })
         .text(`$${gst.toFixed(2)}`, 480, y, { width: 80, align: 'right' });

      if (order.discount > 0) {
        y += 18;
        doc.fillColor('#e63946');
        doc.text(`Discount (${order.couponCode}):`, 350, y, { width: 110, align: 'right' })
           .text(`-$${order.discount.toFixed(2)}`, 480, y, { width: 80, align: 'right' });
        doc.fillColor('#333333');
      }

      y += 22;
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Grand Total:', 380, y, { width: 80, align: 'right' })
         .text(`$${order.amount.toFixed(2)}`, 480, y, { width: 80, align: 'right' });

      // Footer disclaimer
      doc.fontSize(8)
         .font('Helvetica-Oblique')
         .fillColor('#8e8e93')
         .text('Thank you for your business. This is a computer generated document and does not require a physical signature.', 50, 700, { align: 'center', width: 512 });

      doc.end();

      writeStream.on('finish', () => {
        resolve(filePath);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateInvoice };
