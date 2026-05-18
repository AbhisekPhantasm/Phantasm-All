const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://phantasm.in', { waitUntil: 'domcontentloaded' });
  
  const data = await page.evaluate(() => {
    // Look for footer-like elements
    const footers = Array.from(document.querySelectorAll('div')).filter(d => 
      d.className.toLowerCase().includes('footer') || 
      d.id.toLowerCase().includes('footer')
    );
    
    // Look for Book an Appointment
    const appointment = Array.from(document.querySelectorAll('a, button')).find(e => 
      e.innerText.toLowerCase().includes('book an appointment')
    );
    
    return {
      footerClasses: footers.map(f => f.className),
      appointmentFound: !!appointment,
      appointmentTag: appointment?.tagName,
      appointmentClass: appointment?.className
    };
  });
  
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
