// ════════════════════════════════════════════════════════════
// MOODMELT — GOOGLE APPS SCRIPT
// Paste this entire file into Extensions → Apps Script
// Then: Deploy → New Deployment → Web App → Anyone → Deploy
// Copy the Web App URL and give it to Claude
// ════════════════════════════════════════════════════════════

const SHEET_NAME = 'Analytics';
const HEADERS = [
  'Timestamp', 'Session ID', 'Customer Name', 'Event',
  'Page', 'Product Name', 'Order Number', 'Total (Rs)',
  'Products in Cart',
  'Homepage Visits', 'Shop Visits', 'Product Visits',
  'Checkout Visits', 'Contact Visits', 'Add to Carts'
];

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#6B4226').setFontColor('#FAF1E6');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet();
    const row = [
      new Date().toLocaleString('en-PK'),
      data.session_id || '',
      data.customer_name || 'Anonymous',
      data.event || '',
      data.page || '',
      data.product_name || '',
      data.order_number || '',
      data.total || '',
      data.products || '',
      data.page === 'homepage'  ? 1 : 0,
      data.page === 'shop'      ? 1 : 0,
      data.page === 'product'   ? 1 : 0,
      data.page === 'checkout'  ? 1 : 0,
      data.page === 'contact'   ? 1 : 0,
      data.event === 'add_to_cart' ? 1 : 0,
    ];
    sheet.appendRow(row);
    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const action = e.parameter.action;
  if (action === 'report') {
    return generateReport(parseInt(e.parameter.days) || 7);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: 'Moodmelt Analytics Running' })).setMimeType(ContentService.MimeType.JSON);
}

function generateReport(days) {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ report: 'No analytics data yet.' })).setMimeType(ContentService.MimeType.JSON);
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Group by session
  const sessions = {};
  const dailyStats = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const timestamp  = new Date(row[0]);
    if (timestamp < cutoff) continue;

    const sessionId  = row[1] || 'unknown';
    const custName   = row[2] || 'Anonymous';
    const event      = row[3];
    const page       = row[4];
    const product    = row[5];
    const orderNum   = row[6];
    const total      = row[7];
    const products   = row[8];

    // Daily stats
    const dayKey = timestamp.toLocaleDateString('en-PK', { day: '2-digit', month: 'short' });
    if (!dailyStats[dayKey]) dailyStats[dayKey] = { visits: 0, carts: 0, orders: 0 };
    if (event === 'visit')        dailyStats[dayKey].visits++;
    if (event === 'add_to_cart')  dailyStats[dayKey].carts++;
    if (event === 'order')        dailyStats[dayKey].orders++;

    // Per-session stats
    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        name: custName, homepage: 0, shop: 0, product: 0,
        checkout: 0, contact: 0, totalVisits: 0, carts: 0, products: new Set(),
      };
    }
    const s = sessions[sessionId];
    if (custName !== 'Anonymous') s.name = custName;
    if (event === 'visit') {
      s.totalVisits++;
      if (page === 'homepage') s.homepage++;
      else if (page === 'shop')     s.shop++;
      else if (page === 'product')  s.product++;
      else if (page === 'checkout') s.checkout++;
      else if (page === 'contact')  s.contact++;
    }
    if (event === 'add_to_cart') { s.carts++; if (product) s.products.add(product); }
    if (event === 'order' && products) products.split(',').forEach(p => s.products.add(p.trim()));
  }

  // Build report string
  let report = `LAST ${days} DAYS — ALL VISITORS\n`;
  report += '─'.repeat(60) + '\n';

  // Per-visitor breakdown
  let anonCount = 0;
  Object.entries(sessions).forEach(([sid, s]) => {
    const displayName = s.name === 'Anonymous' ? `Anonymous #${++anonCount}` : s.name;
    const total = s.totalVisits || 1;
    const homeP     = Math.round((s.homepage  / total) * 100);
    const shopP     = Math.round((s.shop      / total) * 100);
    const productP  = Math.round((s.product   / total) * 100);
    const checkoutP = Math.round((s.checkout  / total) * 100);
    const contactP  = Math.round((s.contact   / total) * 100);
    const prodList  = s.products.size > 0 ? [...s.products].join(', ') : '—';

    report += `${displayName}\n`;
    report += `  Visits: ${s.totalVisits} | Home: ${homeP}% | Shop: ${shopP}% | Product: ${productP}% | Checkout: ${checkoutP}% | Contact: ${contactP}%\n`;
    report += `  Add to Carts: ${s.carts} | Products: ${prodList}\n`;
    report += '─'.repeat(60) + '\n';
  });

  // Daily summary
  report += '\nDAY-BY-DAY SUMMARY\n';
  report += '─'.repeat(40) + '\n';
  Object.entries(dailyStats).forEach(([day, stats]) => {
    report += `${day} | Visits: ${stats.visits} | Carts: ${stats.carts} | Orders: ${stats.orders}\n`;
  });

  // Page breakdown totals
  let totalVisits = 0, homeTotal = 0, shopTotal = 0, productTotal = 0, checkoutTotal = 0, contactTotal = 0;
  Object.values(sessions).forEach(s => {
    totalVisits  += s.totalVisits;
    homeTotal    += s.homepage;
    shopTotal    += s.shop;
    productTotal += s.product;
    checkoutTotal+= s.checkout;
    contactTotal += s.contact;
  });

  if (totalVisits > 0) {
    report += '\nPAGE BREAKDOWN (overall)\n';
    report += '─'.repeat(40) + '\n';
    report += `Homepage:      ${Math.round((homeTotal     / totalVisits) * 100)}%\n`;
    report += `Shop:          ${Math.round((shopTotal     / totalVisits) * 100)}%\n`;
    report += `Product Pages: ${Math.round((productTotal  / totalVisits) * 100)}%\n`;
    report += `Checkout:      ${Math.round((checkoutTotal / totalVisits) * 100)}%\n`;
    report += `Contact:       ${Math.round((contactTotal  / totalVisits) * 100)}%\n`;
    report += `\nTotal Visits: ${totalVisits} | Total Sessions: ${Object.keys(sessions).length}\n`;
  }

  return ContentService.createTextOutput(JSON.stringify({ report })).setMimeType(ContentService.MimeType.JSON);
}
