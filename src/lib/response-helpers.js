const crypto = require("crypto");

module.exports = function(express) {
    express.response.disableBackButtonRedirect = function(url) {
        this.set("Cache-Control", "no-cache, private, no-store, must-revalidate");
        this.set("Pragma", "no-cache");
        const redirectUrl = url || "/";
        const nonce = crypto.randomBytes(16).toString("hex");
        this.set("Content-Security-Policy", `script-src 'self' 'nonce-${nonce}'`);

        this.send(`
      <script nonce="${nonce}">
        window.location.href = "${redirectUrl}";
      </script>
    `);
    };
};