/**
 * PDF Generator for B2B Proposals and Offer Sheets
 * Creates professional marketing materials using jsPDF
 */

import jsPDF from 'jspdf';

export interface ProposalData {
  clientName: string;
  clientCompany: string;
  signType: string;
  dimensions: string;
  price: number;
  deliveryTime: string;
  customFeatures?: string[];
  designMockup?: string;
}

export class PDFGenerator {
  private createHeader(doc: jsPDF, title: string): void {
    // Add company logo area
    doc.setFillColor(0, 255, 255); // Neon cyan
    doc.rect(20, 10, 170, 25, 'F');

    // Company name
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('NEONHUB', 25, 27);

    // Tagline
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Illuminating Your Brand', 25, 32);

    // Document title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, 50);

    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 50);
  }

  private createFooter(doc: jsPDF, pageHeight: number): void {
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text('NeonHub - Professional Neon Sign Solutions', 20, pageHeight - 20);
    doc.text(
      'Phone: (555) 123-NEON | Email: info@neonhub.com | www.neonhub.com',
      20,
      pageHeight - 15
    );
  }

  async generateProposal(data: ProposalData): Promise<Buffer> {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;

    // Header
    this.createHeader(doc, 'CUSTOM NEON SIGN PROPOSAL');

    let yPos = 70;

    // Client Information
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Client Information', 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${data.clientName}`, 25, yPos);
    yPos += 8;
    doc.text(`Company: ${data.clientCompany}`, 25, yPos);
    yPos += 15;

    // Project Details
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Project Details', 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Sign Type: ${data.signType}`, 25, yPos);
    yPos += 8;
    doc.text(`Dimensions: ${data.dimensions}`, 25, yPos);
    yPos += 8;
    doc.text(`Price: $${data.price.toLocaleString()}`, 25, yPos);
    yPos += 8;
    doc.text(`Delivery Time: ${data.deliveryTime}`, 25, yPos);
    yPos += 15;

    // Custom Features
    if (data.customFeatures && data.customFeatures.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Custom Features', 20, yPos);
      yPos += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      data.customFeatures.forEach(feature => {
        doc.text(`• ${feature}`, 25, yPos);
        yPos += 8;
      });
      yPos += 10;
    }

    // Pricing Breakdown
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Investment Breakdown', 20, yPos);
    yPos += 10;

    // Create pricing table
    const subtotal = data.price * 0.9;
    const tax = data.price * 0.1;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Design & Fabrication:', 25, yPos);
    doc.text(`$${subtotal.toLocaleString()}`, 150, yPos);
    yPos += 8;
    doc.text('Installation & Setup:', 25, yPos);
    doc.text('Included', 150, yPos);
    yPos += 8;
    doc.text('Tax & Fees:', 25, yPos);
    doc.text(`$${tax.toLocaleString()}`, 150, yPos);
    yPos += 10;

    // Total line
    doc.setFont('helvetica', 'bold');
    doc.line(25, yPos, 170, yPos);
    yPos += 8;
    doc.text('Total Investment:', 25, yPos);
    doc.text(`$${data.price.toLocaleString()}`, 150, yPos);
    yPos += 15;

    // Next Steps
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Next Steps', 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const steps = [
      '1. Review and approve this proposal',
      '2. Sign contract and provide 50% deposit',
      '3. Design confirmation and final approval',
      '4. Manufacturing begins (typical 7-14 days)',
      '5. Professional installation and testing',
      '6. Final payment and warranty activation',
    ];

    steps.forEach(step => {
      doc.text(step, 25, yPos);
      yPos += 8;
    });

    // Warranty information
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Warranty & Support', 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('• 2-year full warranty on all components', 25, yPos);
    yPos += 8;
    doc.text('• Free maintenance checkup at 6 months', 25, yPos);
    yPos += 8;
    doc.text('• 24/7 emergency support hotline', 25, yPos);

    // Footer
    this.createFooter(doc, pageHeight);

    return Buffer.from(doc.output('arraybuffer'));
  }

  async generateOfferSheet(signType: string, targetMarket: string): Promise<Buffer> {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;

    // Header
    this.createHeader(doc, `${signType.toUpperCase()} SPECIAL OFFER`);

    let yPos = 70;

    // Main offer
    doc.setFillColor(255, 255, 0); // Yellow highlight
    doc.rect(15, yPos - 5, 180, 30, 'F');

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('LIMITED TIME PROMOTION', 20, yPos + 5);

    doc.setFontSize(24);
    doc.setTextColor(255, 0, 0);
    doc.text('20% OFF', 20, yPos + 18);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`All custom ${signType} orders`, 80, yPos + 18);

    yPos += 45;

    // Offer details
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("What's Included:", 20, yPos);
    yPos += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const includes = [
      '✓ FREE Design Consultation (Value: $200)',
      '✓ Professional Installation Included',
      '✓ Fast 7-day turnaround',
      '✓ 2-year comprehensive warranty',
      '✓ Energy-efficient LED technology',
      '✓ Weather-resistant materials',
      '✓ Remote control capabilities (where applicable)',
    ];

    includes.forEach(item => {
      doc.text(item, 25, yPos);
      yPos += 10;
    });

    yPos += 10;

    // Target market benefits
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Perfect for ${targetMarket}:`, 20, yPos);
    yPos += 12;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const benefits = [
      '• Increase visibility and foot traffic by up to 150%',
      '• Stand out from competitors 24/7',
      '• Modern, professional brand image',
      '• Low energy costs with LED technology',
      '• Customizable to match your brand colors',
      '• Easy maintenance and long-lasting durability',
    ];

    benefits.forEach(benefit => {
      doc.text(benefit, 25, yPos);
      yPos += 8;
    });

    yPos += 15;

    // Call to action
    doc.setFillColor(0, 255, 255);
    doc.rect(15, yPos - 5, 180, 25, 'F');

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTACT US TODAY!', 20, yPos + 8);

    doc.setFontSize(12);
    doc.text('Offer expires end of month • Limited availability', 20, yPos + 18);

    // Footer
    this.createFooter(doc, pageHeight);

    return Buffer.from(doc.output('arraybuffer'));
  }

  async generateCatalog(products: any[]): Promise<Buffer> {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;

    // Header
    this.createHeader(doc, 'NEONHUB PRODUCT CATALOG');

    let yPos = 70;

    // Introduction
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Discover our complete range of custom neon signs and lighting solutions.', 20, yPos);
    doc.text(
      'Each product is crafted with premium materials and cutting-edge LED technology.',
      20,
      yPos + 8
    );
    yPos += 25;

    // Products
    products.forEach((product, index) => {
      // Check if we need a new page
      if (yPos > pageHeight - 80) {
        doc.addPage();
        yPos = 30;
      }

      // Product header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(product.name, 20, yPos);
      yPos += 12;

      // Product details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');

      // Price
      doc.setFont('helvetica', 'bold');
      doc.text(`Starting at $${product.price}`, 20, yPos);
      yPos += 8;

      doc.setFont('helvetica', 'normal');

      // Size options
      if (product.sizes) {
        doc.text(`Size Options: ${product.sizes.join(', ')}`, 25, yPos);
        yPos += 8;
      }

      // Colors
      if (product.colors) {
        doc.text(`Available Colors: ${product.colors.join(', ')}`, 25, yPos);
        yPos += 8;
      }

      // Lead time
      if (product.leadTime) {
        doc.text(`Lead Time: ${product.leadTime}`, 25, yPos);
        yPos += 8;
      }

      // Description
      if (product.description) {
        const lines = doc.splitTextToSize(product.description, 160);
        doc.text(lines, 25, yPos);
        yPos += lines.length * 6;
      }

      yPos += 15;

      // Add separator line
      if (index < products.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.line(20, yPos - 5, 190, yPos - 5);
      }
    });

    // Custom design services section
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 30;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Custom Design Services', 20, yPos);
    yPos += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(
      "Don't see exactly what you're looking for? We specialize in creating unique",
      20,
      yPos
    );
    doc.text('neon signs tailored to your specific brand and vision.', 20, yPos + 8);
    yPos += 20;

    doc.text('Our design process includes:', 20, yPos);
    yPos += 10;

    const designProcess = [
      '• Initial consultation and concept development',
      '• 3D mockups and design refinements',
      '• Material selection and engineering',
      '• Professional manufacturing and quality testing',
      '• Complete installation and setup',
    ];

    designProcess.forEach(item => {
      doc.text(item, 25, yPos);
      yPos += 8;
    });

    // Footer
    this.createFooter(doc, pageHeight);

    return Buffer.from(doc.output('arraybuffer'));
  }
}
