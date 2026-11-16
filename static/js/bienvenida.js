const welcomeDialog = document.getElementById('welcomeDialog');
const welcomeVideo = document.getElementById('welcomeVideo');
const welcomeError = document.getElementById('welcomeError');

function openWelcomeVideo(){
  welcomeError.hidden = true;
  welcomeDialog.showModal();
  const playback = welcomeVideo.play();
  if (playback) {
    playback.catch(error => {
      welcomeError.textContent = error.name === 'NotAllowedError'
        ? 'Presiona reproducir para iniciar el video.'
        : 'No se pudo iniciar el video. Comprueba que el archivo esté disponible e inténtalo de nuevo.';
      welcomeError.hidden = false;
    });
  }
}

document.getElementById('welcomeOpen').addEventListener('click', openWelcomeVideo);
document.getElementById('welcomeClose').addEventListener('click', () => welcomeDialog.close());
welcomeDialog.addEventListener('click', event => {
  if (event.target === welcomeDialog) welcomeDialog.close();
});
welcomeDialog.addEventListener('close', () => {
  welcomeVideo.pause();
  welcomeVideo.currentTime = 0;
});
welcomeVideo.addEventListener('error', () => {
  welcomeError.textContent = 'No se pudo cargar el video. Comprueba que el archivo esté disponible e inténtalo de nuevo.';
  welcomeError.hidden = false;
});

openWelcomeVideo();
