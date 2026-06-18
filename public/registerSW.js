if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    if (registrations) {
      for (var i = 0; i < registrations.length; i++) {
        registrations[i].unregister();
      }
    }
  });
}
