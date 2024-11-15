(() => {
  setInterval(async () => {
    try {
      await window.fetchUrl("/auth/check-session");
    } catch (error) {
      console.log("Session check failed");
    }
  }, 60000);
})();
