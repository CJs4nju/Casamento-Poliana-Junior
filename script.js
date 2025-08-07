// Variáveis Globais e Constantes
let modalSlideIndex = 0;
let modalCarouselInterval = null;

// Variáveis do Sistema de Música
let audioPlayer = null;
let isPlaying = false;
let currentSongIndex = 0;
let isShuffleEnabled = true;
let musicPermissionGranted = false;
let shuffleOrder = [];

// Lista de músicas locais
const playlist = [
    { src: "Musica1.mp3", title: "Música Romântica 1" },
    { src: "Musica2.mp3", title: "Música Romântica 2" },
    { src: "Musica3.mp3", title: "Música Romântica 3" }
];

document.addEventListener("DOMContentLoaded", function() {

    // --- Sistema de Música com Permissão ---
    initializeMusicSystem();

    // --- Funcionalidades Originais --- 

    // Contador regressivo
    const weddingDate = new Date("November 15, 2025 15:00:00").getTime();
    const countdownElement = document.getElementById("countdown");
    if (countdownElement) {
        function updateCountdown() {
            const now = new Date().getTime();
            const distance = weddingDate - now;

            if (distance < 0) {
                countdownElement.innerHTML = "<p>O grande dia chegou!</p>";
                clearInterval(countdownInterval);
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            const daysEl = document.getElementById("days");
            const hoursEl = document.getElementById("hours");
            const minutesEl = document.getElementById("minutes");
            const secondsEl = document.getElementById("seconds");

            if(daysEl) daysEl.innerText = days.toString().padStart(2, "0");
            if(hoursEl) hoursEl.innerText = hours.toString().padStart(2, "0");
            if(minutesEl) minutesEl.innerText = minutes.toString().padStart(2, "0");
            if(secondsEl) secondsEl.innerText = seconds.toString().padStart(2, "0");
        }
        updateCountdown();
        var countdownInterval = setInterval(updateCountdown, 1000);
    }

    // --- Funcionalidade do Botão Pix --- (Atualizado com QR Code)
    const showPixBtn = document.getElementById("show-pix-btn");
    const pixDetails = document.getElementById("pix-details");
    const copyPixBtn = document.getElementById("copy-pix-btn");
    const pixKeyElement = document.getElementById("pix-key");
    const copyFeedback = document.getElementById("copy-feedback");
    const pixQrCode = document.getElementById("pix-qr-code");

    if (showPixBtn && pixDetails) {
        showPixBtn.addEventListener("click", function() {
            const isHidden = pixDetails.classList.contains("hidden");
            pixDetails.classList.toggle("hidden");
            showPixBtn.innerHTML = isHidden ? '<i class="fas fa-eye-slash"></i> Ocultar Chave Pix' : '<i class="fas fa-qrcode"></i> Mostrar Chave Pix';
            if (isHidden) {
                // Reset copy button state when showing details
                copyPixBtn.innerHTML = '<i class="fas fa-copy"></i> Copiar Chave';
                copyFeedback.textContent = "";
                // Gerar QR Code
                generatePixQRCode();
            } else {
                // Ocultar QR Code quando fechar
                pixQrCode.style.display = "none";
            }
        });
    }

    function generatePixQRCode() {
        const pixKey = pixKeyElement.textContent;
        // Usar API gratuita para gerar QR Code
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(pixKey)}&bgcolor=ffffff&color=000000&margin=10`;
        pixQrCode.src = qrCodeUrl;
        pixQrCode.style.display = "block";
    }

    if (copyPixBtn && pixKeyElement) {
        copyPixBtn.addEventListener("click", function() {
            const pixKey = pixKeyElement.textContent;
            navigator.clipboard.writeText(pixKey).then(() => {
                // Success feedback
                copyPixBtn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
                copyFeedback.textContent = "Chave copiada!";
                setTimeout(() => {
                    copyPixBtn.innerHTML = '<i class="fas fa-copy"></i> Copiar Chave';
                    copyFeedback.textContent = "";
                }, 2500); // Reset after 2.5 seconds
            }).catch(err => {
                console.error("Erro ao copiar chave Pix: ", err);
                copyFeedback.textContent = "Erro ao copiar.";
                 setTimeout(() => {
                    copyFeedback.textContent = "";
                }, 2500);
                // Fallback for older browsers (less reliable)
                try {
                    const tempInput = document.createElement("input");
                    tempInput.value = pixKey;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    document.execCommand("copy");
                    document.body.removeChild(tempInput);
                    // Success feedback (fallback)
                    copyPixBtn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
                    copyFeedback.textContent = "Chave copiada!";
                    setTimeout(() => {
                        copyPixBtn.innerHTML = '<i class="fas fa-copy"></i> Copiar Chave';
                        copyFeedback.textContent = "";
                    }, 2500);
                } catch (fallbackErr) {
                    console.error("Erro no fallback de cópia: ", fallbackErr);
                    copyFeedback.textContent = "Erro ao copiar.";
                     setTimeout(() => {
                        copyFeedback.textContent = "";
                    }, 2500);
                }
            });
        });
    }

}); // Fim do DOMContentLoaded

// --- Sistema de Música ---

function initializeMusicSystem() {
    showMusicPermissionModal(); // Mostrar modal imediatamente

    // Event listeners para o modal de permissão
    const allowBtn = document.getElementById("allow-music-btn");
    const denyBtn = document.getElementById("deny-music-btn");
    const permissionModal = document.getElementById("music-permission-modal");

    if (allowBtn) {
        allowBtn.addEventListener("click", function() {
            musicPermissionGranted = true;
            permissionModal.style.display = "none";
            setupMusicPlayer();
            startAutoPlay();
        });
    }

    if (denyBtn) {
        denyBtn.addEventListener("click", function() {
            musicPermissionGranted = false;
            permissionModal.style.display = "none";
        });
    }
}

function showMusicPermissionModal() {
    const modal = document.getElementById("music-permission-modal");
    if (modal) {
        modal.style.display = "block";
    }
}

function setupMusicPlayer() {
    audioPlayer = document.getElementById("audio-player");
    const toggleBtn = document.getElementById("toggle-music");
    const playPauseBtn = document.getElementById("play-pause");
    const prevBtn = document.getElementById("prev-song");
    const nextBtn = document.getElementById("next-song");
    const shuffleBtn = document.getElementById("shuffle-toggle");
    const musicInfo = document.getElementById("music-info");
    const musicButtons = document.getElementById("music-buttons");

    // Mostrar controles
    if (toggleBtn) toggleBtn.style.display = "block";
    if (musicInfo) musicInfo.style.display = "block";
    if (musicButtons) musicButtons.style.display = "flex";

    // Inicializar ordem aleatória
    generateShuffleOrder();

    // Event listeners
    if (toggleBtn) {
        toggleBtn.addEventListener("click", function() {
            const controls = document.querySelector(".music-controls");
            controls.classList.toggle("active");
        });
    }

    if (playPauseBtn) {
        playPauseBtn.addEventListener("click", function() {
            if (isPlaying) {
                pauseMusic();
            } else {
                playMusic();
            }
        });
        
        // Adicionar evento de toque para dispositivos móveis
        playPauseBtn.addEventListener("touchstart", function(e) {
            e.preventDefault(); // Prevenir comportamento padrão
            if (isPlaying) {
                pauseMusic();
            } else {
                playMusic();
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", function() {
            playPreviousSong();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", function() {
            playNextSong();
        });
    }

    if (shuffleBtn) {
        shuffleBtn.addEventListener("click", function() {
            toggleShuffle();
        });
    }

    // Event listeners do áudio
    if (audioPlayer) {
        audioPlayer.addEventListener("ended", function() {
            playNextSong();
        });

        audioPlayer.addEventListener("loadstart", function() {
            updateMusicInfo("Carregando...");
        });

        audioPlayer.addEventListener("canplay", function() {
            updateMusicInfo();
        });

        audioPlayer.addEventListener("error", function() {
            console.error("Erro ao carregar música:", audioPlayer.error);
            updateMusicInfo("Erro ao carregar");
            playNextSong(); // Tentar próxima música
        });
    }
}

function generateShuffleOrder() {
    shuffleOrder = [...Array(playlist.length).keys()];
    // Algoritmo Fisher-Yates para embaralhar
    for (let i = shuffleOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffleOrder[i], shuffleOrder[j]] = [shuffleOrder[j], shuffleOrder[i]];
    }
}

function getCurrentSongIndex() {
    return isShuffleEnabled ? shuffleOrder[currentSongIndex] : currentSongIndex;
}

function startAutoPlay() {
    if (musicPermissionGranted && audioPlayer) {
        loadCurrentSong();
        // Adicionar um pequeno delay para garantir que o áudio esteja carregado
        setTimeout(() => {
            playMusic();
        }, 500);
    }
}

function loadCurrentSong() {
    if (!audioPlayer) return;
    
    const songIndex = getCurrentSongIndex();
    const song = playlist[songIndex];
    
    if (song) {
        audioPlayer.src = song.src;
        audioPlayer.load();
        updateMusicInfo();
    }
}

function playMusic() {
    if (!audioPlayer || !musicPermissionGranted) return;

    // Definir volume para dispositivos móveis
    audioPlayer.volume = 0.7;
    
    audioPlayer.play().then(() => {
        isPlaying = true;
        updatePlayPauseButton();
        console.log("Música iniciada com sucesso");
    }).catch(error => {
        console.error("Erro ao reproduzir música:", error);
        // Em dispositivos móveis, pode ser necessário interação do usuário
        if (error.name === 'NotAllowedError') {
            console.log("Autoplay bloqueado - aguardando interação do usuário");
            updateMusicInfo("Toque para reproduzir");
        } else {
            // Tentar próxima música se houver erro
            playNextSong();
        }
    });
}

function pauseMusic() {
    if (!audioPlayer) return;

    audioPlayer.pause();
    isPlaying = false;
    updatePlayPauseButton();
}

function playNextSong() {
    currentSongIndex = (currentSongIndex + 1) % playlist.length;
    
    // Se chegou ao fim da lista embaralhada, gerar nova ordem
    if (isShuffleEnabled && currentSongIndex === 0) {
        generateShuffleOrder();
    }
    
    loadCurrentSong();
    if (isPlaying) {
        playMusic();
    }
}

function playPreviousSong() {
    currentSongIndex = currentSongIndex === 0 ? playlist.length - 1 : currentSongIndex - 1;
    loadCurrentSong();
    if (isPlaying) {
        playMusic();
    }
}

function toggleShuffle() {
    isShuffleEnabled = !isShuffleEnabled;
    const shuffleBtn = document.getElementById("shuffle-toggle");
    
    if (shuffleBtn) {
        if (isShuffleEnabled) {
            shuffleBtn.classList.add("active");
            generateShuffleOrder();
        } else {
            shuffleBtn.classList.remove("active");
        }
    }
}

function updatePlayPauseButton() {
    const playPauseBtn = document.getElementById("play-pause");
    if (playPauseBtn) {
        playPauseBtn.innerHTML = isPlaying ? '⏸️' : '⏯️';
    }
}

function updateMusicInfo(customText = null) {
    const musicInfoElement = document.getElementById("current-song-title");
    if (musicInfoElement) {
        if (customText) {
            musicInfoElement.textContent = customText;
        } else {
            const songIndex = getCurrentSongIndex();
            const song = playlist[songIndex];
            musicInfoElement.textContent = song ? song.title : "Música não encontrada";
        }
    }
}



// --- Funcionalidade Save the Date ---
const addToCalendarBtn = document.getElementById("add-to-calendar-btn");

if (addToCalendarBtn) {
    addToCalendarBtn.addEventListener("click", function() {
        const eventTitle = "Casamento Poliana e Júnior";
        const eventDescription = "Nosso grande dia! Poliana e Júnior se casam.";
        const eventLocation = "Chácara Paraíso - BA-131, Brejo do coelho, Antônio Gonçalves - BA";
        const eventStart = new Date("2025-11-15T15:00:00"); // 15 de novembro de 2025, 15:00
        const eventEnd = new Date(eventStart.getTime() + (2 * 60 * 60 * 1000)); // 2 horas depois

        // Formatar data para Google Calendar (YYYYMMDDTHHMMSS)
        const formatGoogleDate = (date) => {
            return date.toISOString().replace(/[-:]|\.\d{3}/g, "").slice(0, -4);
        };

        const formattedStartGoogle = formatGoogleDate(eventStart);
        const formattedEndGoogle = formatGoogleDate(eventEnd);

        // Formatar data para Outlook/Apple Calendar (YYYYMMDDTHHMMSSZ)
        const formatOutlookAppleDate = (date) => {
            return date.toISOString().replace(/[-:]|\.\d{3}/g, "");
        };

        const formattedStartOutlookApple = formatOutlookAppleDate(eventStart);
        const formattedEndOutlookApple = formatOutlookAppleDate(eventEnd);

        // Google Calendar URL
        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${formattedStartGoogle}/${formattedEndGoogle}&details=${encodeURIComponent(eventDescription)}&location=${encodeURIComponent(eventLocation)}&sf=true&output=xml`;

        // Outlook/Office 365 Calendar URL
        const outlookCalendarUrl = `https://outlook.live.com/owa/?path=/calendar/action/compose&rru=addevent&startdt=${formattedStartOutlookApple}&enddt=${formattedEndOutlookApple}&subject=${encodeURIComponent(eventTitle)}&body=${encodeURIComponent(eventDescription)}&location=${encodeURIComponent(eventLocation)}`;

        // Yahoo Calendar URL (similar to Outlook)
        const yahooCalendarUrl = `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${encodeURIComponent(eventTitle)}&st=${formattedStartGoogle}&et=${formattedEndGoogle}&desc=${encodeURIComponent(eventDescription)}&loc=${encodeURIComponent(eventLocation)}`;

        // Prompt para o usuário escolher o calendário
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        let calendarUrl = '';

        if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
            // iOS devices (use Google Calendar or a generic webcal link if preferred)
            // For direct iOS calendar integration, webcal:// links are often used, but they require specific server setup.
            // For simplicity and broad compatibility, we'll offer Google or Outlook.
            if (confirm("Deseja adicionar ao Google Calendar?")) {
                calendarUrl = googleCalendarUrl;
            } else if (confirm("Deseja adicionar ao Outlook/Apple Calendar?")) {
                calendarUrl = outlookCalendarUrl; // Outlook works well on iOS too
            } else {
                alert("Nenhum calendário selecionado.");
            }
        } else if (/android/i.test(userAgent)) {
            // Android devices
            if (confirm("Deseja adicionar ao Google Calendar?")) {
                calendarUrl = googleCalendarUrl;
            } else if (confirm("Deseja adicionar ao Outlook Calendar?")) {
                calendarUrl = outlookCalendarUrl;
            } else {
                alert("Nenhum calendário selecionado.");
            }
        } else {
            // Desktop browsers or other devices
            if (confirm("Deseja adicionar ao Google Calendar?")) {
                calendarUrl = googleCalendarUrl;
            } else if (confirm("Deseja adicionar ao Outlook Calendar?")) {
                calendarUrl = outlookCalendarUrl;
            } else if (confirm("Deseja adicionar ao Yahoo Calendar?")) {
                calendarUrl = yahooCalendarUrl;
            } else {
                alert("Nenhum calendário selecionado.");
            }
        }

        if (calendarUrl) {
            window.open(calendarUrl, "_blank");
        }
    });
}

// --- Correção do Sistema de Música ---
// O problema da música pode ser devido ao autoplay policies dos navegadores.
// A solução já implementada com o modal de permissão é a abordagem correta.
// Certifique-se de que o `startAutoPlay()` está sendo chamado após a permissão.
// O código atual já parece estar fazendo isso.
// A função `loadCurrentSong()` também precisa ser chamada antes de `playMusic()`.
// O `audioPlayer.load()` é importante para pré-carregar a música.
// Verificando o código, parece que a lógica está correta.
// O problema pode ser na forma como o `DOMContentLoaded` está sendo executado ou algum erro silencioso.
// Adicionando um `console.log` para depuração.

console.log("Script carregado e DOMContentLoaded disparado.");

// A função `initializeMusicSystem()` já é chamada no DOMContentLoaded.
// A lógica de `startAutoPlay()` e `loadCurrentSong()` parece estar no lugar.
// O `audioPlayer.play().then().catch()` é crucial para lidar com as políticas de autoplay.
// Se a música não estiver tocando, pode ser que o `audioPlayer.play()` esteja falhando silenciosamente
// ou o `musicPermissionGranted` não esteja sendo definido corretamente.
// Vamos garantir que o `audioPlayer` seja inicializado corretamente.

// Removendo o `setTimeout` inicial do `initializeMusicSystem` para testar se o modal aparece imediatamente.
// Isso pode ser a causa do problema se o modal não estiver sendo exibido a tempo.
// O modal deve ser exibido imediatamente se a permissão não foi concedida.

// Ajustando a chamada do modal de permissão para ser mais imediata se não houver permissão.
// A linha `setTimeout(() => { showMusicPermissionModal(); }, 3000);` será removida e a chamada será direta.

// A correção será feita diretamente na função `initializeMusicSystem` no próximo passo, se necessário.
// Por enquanto, a lógica do `Save the Date` foi adicionada.

