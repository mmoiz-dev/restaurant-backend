const PDFDocument = require('pdfkit');

const generatePDF = async (data, restaurantName, reportType) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Add header
      doc.fontSize(20).text(`${restaurantName} - ${reportType.toUpperCase()} REPORT`, {
        align: 'center'
      });
      doc.moveDown();

      // Add timestamp
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, {
        align: 'center'
      });
      doc.moveDown(2);

      // Generate content based on report type
      switch (reportType) {
        case 'sales':
          generateSalesReport(doc, data);
          break;
        case 'inventory':
          generateInventoryReport(doc, data);
          break;
        case 'customers':
          generateCustomersReport(doc, data);
          break;
        case 'popular-dishes':
          generatePopularDishesReport(doc, data);
          break;
        default:
          doc.text('Report type not supported');
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

function generateSalesReport(doc, data) {
  // Summary section
  doc.fontSize(16).text('SALES SUMMARY', { underline: true });
  doc.moveDown();
  
  doc.fontSize(12).text(`Total Orders: ${data.totalOrders}`);
  doc.text(`Total Revenue: $${data.totalRevenue.toFixed(2)}`);
  doc.text(`Average Order Value: $${(data.totalRevenue / data.totalOrders).toFixed(2)}`);
  doc.moveDown();

  // Orders breakdown
  doc.fontSize(14).text('RECENT ORDERS', { underline: true });
  doc.moveDown();

  data.orders.slice(0, 20).forEach((order, index) => {
    doc.fontSize(10).text(`${index + 1}. Order #${order.orderNumber} - $${order.totalAmount.toFixed(2)} - ${order.status}`);
  });
}

function generateInventoryReport(doc, data) {
  // Summary section
  doc.fontSize(16).text('INVENTORY SUMMARY', { underline: true });
  doc.moveDown();
  
  doc.fontSize(12).text(`Total Dishes: ${data.totalDishes}`);
  doc.text(`Low Stock Items: ${data.lowStockDishes}`);
  doc.text(`Out of Stock Items: ${data.outOfStockDishes}`);
  doc.moveDown();

  // Low stock items
  if (data.dishes.filter(dish => dish.isLowStock).length > 0) {
    doc.fontSize(14).text('LOW STOCK ITEMS', { underline: true });
    doc.moveDown();

    data.dishes.filter(dish => dish.isLowStock).forEach((dish, index) => {
      doc.fontSize(10).text(`${index + 1}. ${dish.name} - Stock: ${dish.stockQuantity} - Threshold: ${dish.lowStockThreshold}`);
    });
    doc.moveDown();
  }

  // Out of stock items
  if (data.dishes.filter(dish => dish.isOutOfStock).length > 0) {
    doc.fontSize(14).text('OUT OF STOCK ITEMS', { underline: true });
    doc.moveDown();

    data.dishes.filter(dish => dish.isOutOfStock).forEach((dish, index) => {
      doc.fontSize(10).text(`${index + 1}. ${dish.name} - Price: $${dish.price.toFixed(2)}`);
    });
  }
}

function generateCustomersReport(doc, data) {
  // Summary section
  doc.fontSize(16).text('CUSTOMER ANALYTICS', { underline: true });
  doc.moveDown();
  
  doc.fontSize(12).text(`Total Customers: ${data.totalCustomers}`);
  doc.moveDown();

  // Top customers
  if (data.customerStats.length > 0) {
    doc.fontSize(14).text('TOP CUSTOMERS', { underline: true });
    doc.moveDown();

    data.customerStats.slice(0, 10).forEach((customer, index) => {
      doc.fontSize(10).text(`${index + 1}. Customer ID: ${customer._id} - Orders: ${customer.totalOrders} - Total Spent: $${customer.totalSpent.toFixed(2)}`);
    });
  }
}

function generatePopularDishesReport(doc, data) {
  // Summary section
  doc.fontSize(16).text('POPULAR DISHES', { underline: true });
  doc.moveDown();
  
  doc.fontSize(12).text(`Period: ${data.period.start.toLocaleDateString()} - ${data.period.end.toLocaleDateString()}`);
  doc.moveDown();

  // Popular dishes
  if (data.dishStats.length > 0) {
    doc.fontSize(14).text('MOST ORDERED DISHES', { underline: true });
    doc.moveDown();

    data.dishStats.slice(0, 20).forEach((dish, index) => {
      doc.fontSize(10).text(`${index + 1}. ${dish.dishName} - Quantity: ${dish.totalQuantity} - Revenue: $${dish.totalRevenue.toFixed(2)}`);
    });
  }
}

module.exports = generatePDF; 