const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { logInfo, logError } = require('../utils/logger');
const notificationService = require('./notificationService');

class InvoiceService {
    constructor() {
        this.invoicesDir = path.join(process.cwd(), 'invoices');
        this.ensureInvoicesDirectory();
    }

    ensureInvoicesDirectory() {
        if (!fs.existsSync(this.invoicesDir)) {
            fs.mkdirSync(this.invoicesDir, { recursive: true });
        }
    }

    async createInvoice(businessId, invoiceData) {
        try {
            const invoiceNumber = await Invoice.generateInvoiceNumber(businessId);

            const invoice = new Invoice({
                businessId,
                invoiceNumber,
                customerId: invoiceData.customerId,
                relatedTo: invoiceData.relatedTo,
                type: invoiceData.type || 'invoice',
                issueDate: invoiceData.issueDate || new Date(),
                dueDate: invoiceData.dueDate || this.calculateDueDate(30),
                business: invoiceData.business,
                customer: invoiceData.customer,
                items: invoiceData.items,
                discount: invoiceData.discount || 0,
                discountPercentage: invoiceData.discountPercentage || 0,
                currency: invoiceData.currency || 'ILS',
                notes: invoiceData.notes,
                terms: invoiceData.terms
            });

            await invoice.save();

            logInfo('Invoice created successfully', {
                businessId,
                invoiceId: invoice._id,
                invoiceNumber: invoice.invoiceNumber
            });

            return {
                success: true,
                invoice
            };

        } catch (error) {
            logError('Failed to create invoice', error, { businessId });
            throw error;
        }
    }

    async generatePDF(invoiceId) {
        try {
            const invoice = await Invoice.findById(invoiceId);
            if (!invoice) {
                throw new Error('Invoice not found');
            }

            const fileName = `${invoice.invoiceNumber}.pdf`;
            const filePath = path.join(this.invoicesDir, fileName);

            await this.createPDFDocument(invoice, filePath);

            invoice.pdfUrl = filePath;
            await invoice.save();

            logInfo('Invoice PDF generated', {
                invoiceId: invoice._id,
                filePath
            });

            return {
                success: true,
                filePath,
                fileName
            };

        } catch (error) {
            logError('Failed to generate PDF', error, { invoiceId });
            throw error;
        }
    }

    async createPDFDocument(invoice, filePath) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ size: 'A4', margin: 50 });
                const stream = fs.createWriteStream(filePath);

                doc.pipe(stream);

                this.addHeader(doc, invoice);
                this.addBusinessInfo(doc, invoice.business);
                this.addCustomerInfo(doc, invoice.customer);
                this.addInvoiceDetails(doc, invoice);
                this.addItemsTable(doc, invoice.items);
                this.addTotals(doc, invoice);
                this.addFooter(doc, invoice);

                doc.end();

                stream.on('finish', () => resolve());
                stream.on('error', reject);

            } catch (error) {
                reject(error);
            }
        });
    }

    addHeader(doc, invoice) {
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .text(this.getInvoiceTypeHebrew(invoice.type), 50, 50, { align: 'right' });

        doc.fontSize(10)
           .font('Helvetica')
           .text(`מספר: ${invoice.invoiceNumber}`, 50, 80, { align: 'right' })
           .text(`תאריך: ${this.formatDate(invoice.issueDate)}`, 50, 95, { align: 'right' });

        doc.moveDown(2);
    }

    addBusinessInfo(doc, business) {
        const startY = 140;
        
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('מ:', 400, startY, { align: 'right' });

        doc.fontSize(10)
           .font('Helvetica')
           .text(business.name, 400, startY + 20, { align: 'right' });

        if (business.businessNumber) {
            doc.text(`ח.פ: ${business.businessNumber}`, 400, startY + 35, { align: 'right' });
        }

        if (business.vatNumber) {
            doc.text(`מע"מ: ${business.vatNumber}`, 400, startY + 50, { align: 'right' });
        }

        if (business.address) {
            doc.text(`${business.address.street || ''}`, 400, startY + 65, { align: 'right' });
            doc.text(`${business.address.city || ''} ${business.address.zip || ''}`, 400, startY + 80, { align: 'right' });
        }

        if (business.phone) {
            doc.text(`טל: ${business.phone}`, 400, startY + 95, { align: 'right' });
        }

        if (business.email) {
            doc.text(`אימייל: ${business.email}`, 400, startY + 110, { align: 'right' });
        }
    }

    addCustomerInfo(doc, customer) {
        const startY = 140;
        
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('ל:', 50, startY);

        doc.fontSize(10)
           .font('Helvetica')
           .text(customer.name, 50, startY + 20);

        if (customer.companyName) {
            doc.text(customer.companyName, 50, startY + 35);
        }

        if (customer.idNumber) {
            doc.text(`ת.ז: ${customer.idNumber}`, 50, startY + 50);
        }

        if (customer.vatNumber) {
            doc.text(`מע"מ: ${customer.vatNumber}`, 50, startY + 65);
        }

        if (customer.address) {
            doc.text(`${customer.address.street || ''}`, 50, startY + 80);
            doc.text(`${customer.address.city || ''} ${customer.address.zip || ''}`, 50, startY + 95);
        }

        if (customer.phone) {
            doc.text(`טל: ${customer.phone}`, 50, startY + 110);
        }
    }

    addInvoiceDetails(doc, invoice) {
        const startY = 300;

        doc.fontSize(10)
           .text(`תאריך יצירה: ${this.formatDate(invoice.issueDate)}`, 400, startY, { align: 'right' })
           .text(`תאריך תשלום: ${this.formatDate(invoice.dueDate)}`, 400, startY + 15, { align: 'right' });
    }

    addItemsTable(doc, items) {
        const startY = 350;
        const tableTop = startY;
        const itemCodeX = 50;
        const descriptionX = 120;
        const quantityX = 320;
        const priceX = 380;
        const totalX = 480;

        doc.fontSize(10)
           .font('Helvetica-Bold')
           .text('#', itemCodeX, tableTop, { align: 'right' })
           .text('תיאור', descriptionX, tableTop, { align: 'right' })
           .text('כמות', quantityX, tableTop, { align: 'right' })
           .text('מחיר ליחידה', priceX, tableTop, { align: 'right' })
           .text('סה"כ', totalX, tableTop, { align: 'right' });

        doc.moveTo(50, tableTop + 20)
           .lineTo(545, tableTop + 20)
           .stroke();

        let currentY = tableTop + 30;

        items.forEach((item, index) => {
            doc.fontSize(9)
               .font('Helvetica')
               .text(index + 1, itemCodeX, currentY)
               .text(item.description, descriptionX, currentY, { width: 180 })
               .text(item.quantity.toString(), quantityX, currentY, { align: 'right' })
               .text(`₪${item.unitPrice.toFixed(2)}`, priceX, currentY, { align: 'right' })
               .text(`₪${item.total.toFixed(2)}`, totalX, currentY, { align: 'right' });

            currentY += 25;
        });

        return currentY;
    }

    addTotals(doc, invoice) {
        const startY = 600;
        const labelX = 400;
        const valueX = 500;

        doc.fontSize(10)
           .font('Helvetica-Bold')
           .text('סכום ביניים:', labelX, startY, { align: 'right' })
           .text(`₪${invoice.subtotal.toFixed(2)}`, valueX, startY, { align: 'right' });

        if (invoice.discount > 0) {
            doc.text('הנחה:', labelX, startY + 20, { align: 'right' })
               .text(`-₪${invoice.discount.toFixed(2)}`, valueX, startY + 20, { align: 'right' });
        }

        if (invoice.taxTotal > 0) {
            doc.text('מע"מ:', labelX, startY + 40, { align: 'right' })
               .text(`₪${invoice.taxTotal.toFixed(2)}`, valueX, startY + 40, { align: 'right' });
        }

        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('סה"כ לתשלום:', labelX, startY + 60, { align: 'right' })
           .text(`₪${invoice.total.toFixed(2)}`, valueX, startY + 60, { align: 'right' });

        doc.moveTo(380, startY + 55)
           .lineTo(545, startY + 55)
           .stroke();
    }

    addFooter(doc, invoice) {
        const startY = 720;

        if (invoice.notes) {
            doc.fontSize(9)
               .font('Helvetica')
               .text('הערות:', 50, startY)
               .text(invoice.notes, 50, startY + 15, { width: 500 });
        }

        if (invoice.terms) {
            doc.fontSize(8)
               .text(invoice.terms, 50, 760, { width: 500, align: 'center' });
        }
    }

    async sendInvoiceByEmail(invoiceId, emailOptions = {}) {
        try {
            const invoice = await Invoice.findById(invoiceId)
                .populate('customerId', 'firstName lastName email');

            if (!invoice) {
                throw new Error('Invoice not found');
            }

            if (!invoice.pdfUrl) {
                await this.generatePDF(invoiceId);
                await invoice.reload();
            }

            const emailData = {
                to: emailOptions.to || invoice.customer.email,
                subject: emailOptions.subject || `חשבונית ${invoice.invoiceNumber}`,
                html: `
                    <div dir="rtl" style="font-family: Arial, sans-serif;">
                        <h2>שלום ${invoice.customer.name},</h2>
                        <p>מצורפת חשבונית מספר ${invoice.invoiceNumber}</p>
                        <p><strong>סכום לתשלום:</strong> ₪${invoice.total.toFixed(2)}</p>
                        <p><strong>תאריך תשלום:</strong> ${this.formatDate(invoice.dueDate)}</p>
                        <br>
                        <p>תודה,<br>${invoice.business.name}</p>
                    </div>
                `,
                attachments: [
                    {
                        filename: `${invoice.invoiceNumber}.pdf`,
                        path: invoice.pdfUrl
                    }
                ]
            };

            await notificationService.sendEmail(emailData);

            await invoice.markAsSent(emailData.to);

            logInfo('Invoice sent by email', {
                invoiceId: invoice._id,
                to: emailData.to
            });

            return {
                success: true,
                invoice
            };

        } catch (error) {
            logError('Failed to send invoice by email', error, { invoiceId });
            throw error;
        }
    }

    async createInvoiceFromPayment(paymentId) {
        try {
            const payment = await Payment.findById(paymentId)
                .populate('businessId', 'profile email')
                .populate('customerId', 'firstName lastName email phone');

            if (!payment) {
                throw new Error('Payment not found');
            }

            if (payment.invoiceId) {
                throw new Error('Invoice already exists for this payment');
            }

            const invoiceData = {
                customerId: payment.customerId._id,
                relatedTo: payment.relatedTo,
                type: 'tax_invoice',
                business: {
                    name: payment.businessId.profile?.businessName || 'Business',
                    email: payment.businessId.email,
                    businessNumber: payment.businessId.profile?.businessNumber,
                    vatNumber: payment.businessId.profile?.vatNumber,
                    phone: payment.businessId.profile?.phone,
                    address: payment.businessId.profile?.address
                },
                customer: {
                    name: `${payment.customerId.firstName} ${payment.customerId.lastName}`,
                    email: payment.customerId.email,
                    phone: payment.customerId.phone,
                    idNumber: payment.customer.idNumber,
                    companyName: payment.billing?.companyName,
                    vatNumber: payment.billing?.vatNumber,
                    address: payment.billing?.address
                },
                items: [{
                    description: payment.notes || 'תשלום',
                    quantity: 1,
                    unitPrice: payment.amount,
                    total: payment.amount
                }],
                currency: payment.currency
            };

            const result = await this.createInvoice(payment.businessId._id, invoiceData);

            payment.invoiceId = result.invoice._id;
            await payment.save();

            await this.generatePDF(result.invoice._id);

            return result;

        } catch (error) {
            logError('Failed to create invoice from payment', error, { paymentId });
            throw error;
        }
    }

    calculateDueDate(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date;
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('he-IL');
    }

    getInvoiceTypeHebrew(type) {
        const types = {
            invoice: 'חשבונית',
            receipt: 'קבלה',
            tax_invoice: 'חשבונית מס',
            credit_note: 'זיכוי'
        };
        return types[type] || 'חשבונית';
    }

    async getBusinessInvoices(businessId, filters = {}) {
        try {
            const query = { businessId };

            if (filters.status) {
                query.status = filters.status;
            }

            if (filters.startDate || filters.endDate) {
                query.issueDate = {};
                if (filters.startDate) query.issueDate.$gte = new Date(filters.startDate);
                if (filters.endDate) query.issueDate.$lte = new Date(filters.endDate);
            }

            const invoices = await Invoice.find(query)
                .sort({ invoiceNumber: -1 })
                .limit(filters.limit || 100);

            return invoices;

        } catch (error) {
            logError('Failed to get business invoices', error, { businessId });
            throw error;
        }
    }
}

module.exports = new InvoiceService();
