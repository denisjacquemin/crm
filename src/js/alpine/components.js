// Create new file for Alpine components
window.Components = {
  tooltip: () => ({
    show: false,
    text: '',
    x: 0,
    y: 0,
    timeoutId: null,
    showTooltip(text, event) {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }

      this.text = text;
      this.show = true;
      const rect = event.target.getBoundingClientRect();
      this.x = rect.left;
      this.y = rect.bottom + window.scrollY + 5;
    },
    hideTooltip() {
      this.timeoutId = setTimeout(() => {
        this.show = false;
        this.timeoutId = null;
      }, 200);
    },
    destroy() {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
    },
  }),
};

// Register components when Alpine is ready
document.addEventListener('alpine:init', () => {
  Object.entries(window.Components).forEach(([name, component]) => {
    Alpine.data(name, component);
  });
});
