// Lighthouse-Config: Mobile-orientiert, fokus auf Performance/SEO/Best Practices/Accessibility
module.exports = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance','accessibility','best-practices','seo'],
    formFactor: 'mobile',
    screenEmulation: { mobile: true, width: 360, height: 640, deviceScaleFactor: 2, disabled: false },
  }
};
