       // Global state
        let isRecording = false;
        let activityData = [];
        let audioContext = null;
        let currentInstruments = new Set();
        
        // Statistics
        let stats = {
            tabSwitches: 0,
            keystrokes: 0,
            mouseClicks: 0,
            tempo: 120
        };
        
        // DOM elements
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const playBtn = document.getElementById('playBtn');
        const clearBtn = document.getElementById('clearBtn');
        const activityLog = document.getElementById('activityLog');
        const currentNote = document.getElementById('currentNote');
        
        // Piano mapping - C Major scale across alphabet keys
        const pianoNotes = {
            // C Major scale mapped to QWERTY layout
            'q': { note: 'C4', freq: 261.63 },
            'w': { note: 'D4', freq: 293.66 },
            'e': { note: 'E4', freq: 329.63 },
            'r': { note: 'F4', freq: 349.23 },
            't': { note: 'G4', freq: 392.00 },
            'y': { note: 'A4', freq: 440.00 },
            'u': { note: 'B4', freq: 493.88 },
            'i': { note: 'C5', freq: 523.25 },
            'o': { note: 'D5', freq: 587.33 },
            'p': { note: 'E5', freq: 659.25 },
            
            'a': { note: 'F5', freq: 698.46 },
            's': { note: 'G5', freq: 783.99 },
            'd': { note: 'A5', freq: 880.00 },
            'f': { note: 'B5', freq: 987.77 },
            'g': { note: 'C6', freq: 1046.50 },
            'h': { note: 'D6', freq: 1174.66 },
            'j': { note: 'E6', freq: 1318.51 },
            'k': { note: 'F6', freq: 1396.91 },
            'l': { note: 'G6', freq: 1567.98 },
            
            'z': { note: 'C3', freq: 130.81 },
            'x': { note: 'D3', freq: 146.83 },
            'c': { note: 'E3', freq: 164.81 },
            'v': { note: 'F3', freq: 174.61 },
            'b': { note: 'G3', freq: 196.00 },
            'n': { note: 'A3', freq: 220.00 },
            'm': { note: 'B3', freq: 246.94 }
        };
        
        // Guitar string frequencies (standard tuning)
        const guitarStrings = {
            '1': { string: 'High E', freq: 329.63 }, // 1st string (high E)
            '2': { string: 'B', freq: 246.94 },      // 2nd string (B)
            '3': { string: 'G', freq: 196.00 },      // 3rd string (G)
            '4': { string: 'D', freq: 146.83 },      // 4th string (D)
            '5': { string: 'A', freq: 110.00 },      // 5th string (A)
            '6': { string: 'Low E', freq: 82.41 },   // 6th string (low E)
            '0': { string: 'All Strings', freq: 220.00 } // Open strum
        };
        
        // Special keys for percussion and effects
        const specialSounds = {
            ' ': { name: 'Kick Drum', freq: 60.00 },
            'Enter': { name: 'Snare', freq: 200.00 },
            'Backspace': { name: 'Hi-Hat', freq: 800.00 },
            'Tab': { name: 'Cymbal', freq: 1200.00 },
            'Shift': { name: 'Bass', freq: 80.00 },
            'Control': { name: 'Tom', freq: 150.00 }
        };
        
        // Initialize Web Audio API
        function initAudio() {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                if (audioContext.state === 'suspended') {
                    audioContext.resume();
                }
                
                setTimeout(() => {
                    playPianoNote(440, 0.3); // A4 test note
                    logActivity('Audio', 'Audio system initialized! 🔊');
                }, 100);
            }
        }
        
        // Play piano note with piano-like sound
        function playPianoNote(frequency, duration = 0.8) {
            if (!audioContext) return;
            
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            try {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                const filter = audioContext.createBiquadFilter();
                
                oscillator.connect(gainNode);
                gainNode.connect(filter);
                filter.connect(audioContext.destination);
                
                // Piano-like tone
                oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
                oscillator.type = 'triangle';
                
                // Piano brightness filter
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(frequency * 3, audioContext.currentTime);
                filter.Q.setValueAtTime(1, audioContext.currentTime);
                
                // Piano attack and decay
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.1, audioContext.currentTime + 0.2);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + duration);
                
            } catch (error) {
                console.error('Error playing piano note:', error);
            }
        }
        
        // Play guitar string with guitar-like sound
        function playGuitarString(frequency, duration = 1.2) {
            if (!audioContext) return;
            
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            try {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                const filter = audioContext.createBiquadFilter();
                
                oscillator.connect(gainNode);
                gainNode.connect(filter);
                filter.connect(audioContext.destination);
                
                // Guitar-like tone
                oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
                oscillator.type = 'sawtooth';
                
                // Guitar body resonance
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(frequency * 2, audioContext.currentTime);
                filter.Q.setValueAtTime(3, audioContext.currentTime);
                
                // Guitar pluck attack and sustain
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.02);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + duration);
                
            } catch (error) {
                console.error('Error playing guitar string:', error);
            }
        }
        
        // Play percussion/special sound
        function playSpecialSound(frequency, duration = 0.3) {
            if (!audioContext) return;
            
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            try {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                const filter = audioContext.createBiquadFilter();
                
                oscillator.connect(gainNode);
                gainNode.connect(filter);
                filter.connect(audioContext.destination);
                
                // Percussive sound
                oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
                oscillator.type = frequency < 100 ? 'sine' : 'square';
                
                // Sharp attack for percussion
                filter.type = 'highpass';
                filter.frequency.setValueAtTime(frequency * 0.5, audioContext.currentTime);
                
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + duration);
                
            } catch (error) {
                console.error('Error playing special sound:', error);
            }
        }
        
        // Add activity to log with proper styling
        function logActivity(activity, details, instrumentType = '') {
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = {
                timestamp,
                activity,
                details,
                time: Date.now(),
                instrumentType
            };
            
            activityData.push(logEntry);
            
            const activityItem = document.createElement('div');
            activityItem.className = `activity-item ${instrumentType}`;
            activityItem.innerHTML = `<strong>${timestamp}</strong> - ${activity}: ${details}`;
            
            activityLog.appendChild(activityItem);
            activityLog.scrollTop = activityLog.scrollHeight;
            
            // Update current note display
            if (activity === 'Piano' || activity === 'Guitar' || activity === 'Percussion') {
                currentNote.textContent = details;
                setTimeout(() => {
                    if (currentNote.textContent === details) {
                        currentNote.textContent = 'Press keys to make music!';
                    }
                }, 2000);
            }
        }
        
        // Track tab changes
        function trackTabActivity() {
            window.addEventListener('focus', () => {
                if (isRecording) {
                    stats.tabSwitches++;
                    updateStats();
                    logActivity('Tab Switch', `Returned to: ${window.location.hostname}`);
                    playPianoNote(523.25, 0.5); // C5 chord for tab switch
                }
            });
            
            window.addEventListener('blur', () => {
                if (isRecording) {
                    logActivity('Tab Switch', `Left: ${window.location.hostname}`);
                }
            });
            
            document.addEventListener('visibilitychange', () => {
                if (isRecording && !document.hidden) {
                    stats.tabSwitches++;
                    updateStats();
                    logActivity('Tab Switch', `Visible: ${window.location.hostname}`);
                }
            });
        }
        
        // Update statistics display
        function updateStats() {
            document.getElementById('tabSwitches').textContent = stats.tabSwitches;
            document.getElementById('keystrokes').textContent = stats.keystrokes;
            document.getElementById('mouseClicks').textContent = stats.mouseClicks;
            document.getElementById('tempo').textContent = Math.round(stats.tempo);
            document.getElementById('instruments').textContent = currentInstruments.size;
        }
        
        // Event listeners for activity tracking
        function startTracking() {
            trackTabActivity();
            
            // Track keystrokes with musical mapping
            document.addEventListener('keydown', (e) => {
                if (isRecording) {
                    stats.keystrokes++;
                    updateStats();
                    const key = e.key.toLowerCase();
                    
                    // Check what type of key was pressed
                    if (pianoNotes[key]) {
                        // Piano note
                        const noteInfo = pianoNotes[key];
                        playPianoNote(noteInfo.freq);
                        logActivity('Piano', `${noteInfo.note} (${key.toUpperCase()})`, 'piano');
                        currentInstruments.add('piano');
                        
                    } else if (guitarStrings[key]) {
                        // Guitar string
                        const stringInfo = guitarStrings[key];
                        playGuitarString(stringInfo.freq);
                        logActivity('Guitar', `${stringInfo.string} String (${key})`, 'guitar');
                        currentInstruments.add('guitar');
                        
                    } else if (specialSounds[e.key]) {
                        // Special percussion
                        const soundInfo = specialSounds[e.key];
                        playSpecialSound(soundInfo.freq);
                        logActivity('Percussion', `${soundInfo.name}`, 'percussion');
                        currentInstruments.add('percussion');
                        
                    } else {
                        // Default sound for other keys
                        const defaultFreq = 300 + (e.key.charCodeAt(0) % 26) * 20;
                        playSpecialSound(defaultFreq, 0.4);
                        logActivity('Other', `${e.key}`, 'other');
                    }
                    
                    // Gradually increase tempo with activity
                    stats.tempo = Math.min(180, stats.tempo + 0.5);
                }
            });
            
            // Track mouse clicks
            document.addEventListener('click', (e) => {
                if (isRecording) {
                    stats.mouseClicks++;
                    updateStats();
                    // Play a pleasant chime for clicks
                    playPianoNote(880, 0.4); // A5
                    logActivity('Mouse Click', `Click at (${e.clientX}, ${e.clientY})`);
                    currentInstruments.add('effects');
                }
            });
            
            // Track scrolling
            let scrollTimeout;
            document.addEventListener('scroll', (e) => {
                if (isRecording) {
                    clearTimeout(scrollTimeout);
                    scrollTimeout = setTimeout(() => {
                        playPianoNote(440 + (window.scrollY % 200), 0.2);
                        logActivity('Scroll', `Position: ${window.scrollY}`);
                    }, 150);
                }
            });
        }
        
        // Button event listeners
        startBtn.addEventListener('click', () => {
            initAudio();
            isRecording = true;
            startBtn.classList.add('active');
            logActivity('Session', 'Recording started! 🎵');
            currentNote.textContent = 'Recording... Play some keys!';
            
            // Play a welcome chord
            setTimeout(() => {
                playPianoNote(261.63, 0.3); // C4
                setTimeout(() => playPianoNote(329.63, 0.3), 100); // E4
                setTimeout(() => playPianoNote(392.00, 0.3), 200); // G4
            }, 200);
        });
        
        pauseBtn.addEventListener('click', () => {
            isRecording = false;
            startBtn.classList.remove('active');
            logActivity('Session', 'Recording paused ⏸️');
            currentNote.textContent = 'Recording paused';
        });
        
        playBtn.addEventListener('click', () => {
            logActivity('Playback', 'Playing your procrastination symphony! 🎼');
            playBackSymphony();
        });
        
        clearBtn.addEventListener('click', () => {
            activityData = [];
            stats = { tabSwitches: 0, keystrokes: 0, mouseClicks: 0, tempo: 120 };
            currentInstruments.clear();
            activityLog.innerHTML = '<div class="activity-item">Session cleared. Ready for a new symphony! 🎵</div>';
            currentNote.textContent = 'Press keys to make music!';
            updateStats();
        });
        
        // Playback function
        function playBackSymphony() {
            if (activityData.length === 0) {
                logActivity('Error', 'No activity recorded yet!');
                return;
            }
            
            currentNote.textContent = 'Playing symphony...';
            
            let playbackIndex = 0;
            const playbackSpeed = 300;
            
            const playbackInterval = setInterval(() => {
                if (playbackIndex >= activityData.length) {
                    clearInterval(playbackInterval);
                    logActivity('Playback', 'Symphony complete! 👏');
                    currentNote.textContent = 'Symphony complete!';
                    return;
                }
                
                const activity = activityData[playbackIndex];
                
                // Replay the sounds from the activity
                if (activity.instrumentType === 'piano' && activity.details.includes('(')) {
                    const key = activity.details.match(/\(([^)]+)\)/)[1].toLowerCase();
                    if (pianoNotes[key]) {
                        playPianoNote(pianoNotes[key].freq, 0.5);
                    }
                } else if (activity.instrumentType === 'guitar' && activity.details.includes('(')) {
                    const key = activity.details.match(/\(([^)]+)\)/)[1];
                    if (guitarStrings[key]) {
                        playGuitarString(guitarStrings[key].freq, 0.8);
                    }
                } else if (activity.activity === 'Mouse Click') {
                    playPianoNote(880, 0.3);
                }
                
                playbackIndex++;
            }, playbackSpeed);
        }
        
        // Initialize tracking
        startTracking();
        updateStats();
        
        // Demo instructions
        // Song playback functionality
        function playSong(sequence, songName) {
            const keys = sequence.split(' ');
            let keyIndex = 0;
    
        // Find the song card and mark as playing
        const songCard = document.querySelector(`[data-sequence="${sequence}"]`);
        if (songCard) {
            songCard.classList.add('playing');
        }
    
        logActivity('Song', `Playing "${songName}" 🎵`);
        currentNote.textContent = `Playing: ${songName}`;
    
        const playInterval = setInterval(() => {
        if (keyIndex >= keys.length) {
            clearInterval(playInterval);
            logActivity('Song', `Finished "${songName}" 🎼`);
            currentNote.textContent = `Finished: ${songName}`;
            
            // Remove playing class
            if (songCard) {
                songCard.classList.remove('playing');
            }
            
            setTimeout(() => {
                if (currentNote.textContent === `Finished: ${songName}`) {
                    currentNote.textContent = 'Press keys to make music!';
                }
            }, 2000);
            return;
        }
        
        const key = keys[keyIndex].toLowerCase();
        if (pianoNotes[key]) {
            const noteInfo = pianoNotes[key];
            playPianoNote(noteInfo.freq, 0.6);
            currentNote.textContent = `${songName}: ${noteInfo.note}`;
            
            // Visual feedback - highlight the key being played
            const keyDisplay = keys[keyIndex].toUpperCase();
            setTimeout(() => {
                if (currentNote.textContent === `${songName}: ${noteInfo.note}`) {
                    currentNote.textContent = `Playing: ${songName}`;
                }}, 400);
            }
            keyIndex++;
        }, 600); // Slightly slower tempo for melody recognition
        }
        // Add event listeners for song cards
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('play-song-btn')) {
                e.stopPropagation();
                initAudio(); // Ensure audio is initialized
                const songCard = e.target.closest('.song-card');
                const sequence = songCard.dataset.sequence;
                const songName = songCard.dataset.name;
                playSong(sequence, songName);
            }
            // Also allow clicking the entire card
            if (e.target.classList.contains('song-card') || e.target.closest('.song-card')) {
                const songCard = e.target.classList.contains('song-card') ? e.target : e.target.closest('.song-card');
                if (!e.target.classList.contains('play-song-btn')) {
                    initAudio();
                    const sequence = songCard.dataset.sequence;
                    const songName = songCard.dataset.name;
                    playSong(sequence, songName);
                }
            }
        });
        // Demo instructions
        setTimeout(() => {
            if (activityData.length === 0) {
                logActivity('Guide', 'Try the melodies above, or Q-W-E-R-T-Y for piano notes, 1-2-3-4-5-6 for guitar strings!');
            }
        }, 3000);