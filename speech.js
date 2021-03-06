var BeneSpeak = {
    
    'BLOCK_DELIMITERS' : ['p', 'div', 'pagenum', 'td', 'table', 'li', 'ul', 'ol'],
    'BOUNDARY_PUNCTUATION' : [',', ';', '.', '-', '�', '�', '?', '!'],
    'IGNORABLE_PUNCTUATION' : ['"', '\'', '�', '�', '�', '�'],

    '_tokenize' : function(element) {
        var r = { 'src' : element, 'spanMap' : {}, 'text' : "", 'ttsMarkup' : "", 'markup' : element.innerHTML, 'lastOffset' : null};
        var t = {
            inTag : false,
            counter : 0,
            wsIdx : -1,
            weIdx : -1,
            text : '',
            markup : '',
            word : '',
            html : ''
        }
        
        var raw = element.innerHTML;
        var limit = raw.length;
        var i = 0;
        while (i <= limit) {
            if (t.inTag) {
                t.html += raw[i];
                if (raw[i] == ">") {
                    t.inTag = false;
                    // if it's a block element delimiter, flush
                    var blockCheck = t.html.match(/<\/(.*?)>$/);
                    if (blockCheck != null) {
                        if (this.BLOCK_DELIMITERS.indexOf(blockCheck[1]) > -1) {
                            this._flush(t, r);
                            t.text += ' ';
                        }
                    }
                }
            } else {
                if (i == limit || raw[i].match(/\s/)) {
                    this._flush(t, r);
                    
                    // append the captured whitespace
                    if (i < limit) {
                        t.text += raw[i];
                        t.markup += raw[i];
                    }
                }
                else if (this.BOUNDARY_PUNCTUATION.indexOf(raw[i]) > -1) {
                    this._flush(t, r);
                    
                    t.wsIdx = t.html.length;
                    t.weIdx = t.html.length + 1;
                    t.word += raw[i];
                    t.html += raw[i];
                    
                    this._flush(t, r);
                    
                } else if (raw[i] == "<") {
                    t.inTag = true;
                    t.html += raw[i];
                } else {
                    if (t.word.length == 0) {
                        t.wsIdx = t.html.length;
                    }
                    t.weIdx = t.html.length + 1;
                    t.word += raw[i];
                    t.html += raw[i];
                }
            }
            i++;
        }
        
        r.text = t.text;
        r.ttsMarkup = t.markup;
        
        return r;
    },
    
    '_flush' : function(t, r) {
        if (t.word.length > 0) {
            var pos = t.text.length;
            r.spanMap[pos] = t.counter;
            t.text += t.word;
            t.markup += t.html.substring(0, t.wsIdx) +
                        '<span class="ttshlf" id="tts_' + t.counter + '">' +
                        t.html.substring(t.wsIdx, t.weIdx) +
                        '</span>' + t.html.substring(t.weIdx, t.html.length);
            t.word = "";
            t.html = "";
            t.wsIdx = -1;
            t.weIdx = -1;
            t.counter++;
        }
    },
    
    'speak' : function(element, callback) {
        var status = this._tokenize(element);
	element.innerHTML = status.ttsMarkup        
	this._forTTS = new SpeechSynthesisUtterance(status.text);
	var voices = window.speechSynthesis.getVoices();   
	for(var i = 0; i < voices.length; i++ ) {
	        console.log("Voice " + i.toString() + ' ' + voices[i].name + ' ' + voices[i].uri);
      	}
      	this._forTTS.voice = voices[10]; // Note: some voices don't support altering params.  For Mac voice 10 (alex) is native.
	this._forTTS.voiceURI = 'native';
        this._forTTS.onboundary = this._getEventListener(element, status, callback);
        speechSynthesis.speak(this._forTTS);
    },
    
    'stop' : function(j) {
        speechSynthesis.stop();
    },
    
    '_getEventListener' : function(element, status, callback) {
        return function(event) {
           if (event.name == 'word') {
                // look up the offset in the map
                if (status.spanMap.hasOwnProperty(event.charIndex)) {
                    if (status.lastOffset != null) {
                        var os = document.getElementById('tts_' + status.spanMap[status.lastOffset])
                        os.className = os.className.replace('ttshln', 'ttshlf');
                    }
                    var ts = document.getElementById('tts_' + status.spanMap[event.charIndex]);
                    ts.className = ts.className.replace('ttshlf', 'ttshln');
                    status.lastOffset = event.charIndex;
                }
            // need to fix this next using onend event
            } else if (event.name == 'interrupted' || event.name == 'end') {
                element.innerHTML = status.markup;
                if (callback != null) {
                    callback();
                }
            }
        };
    },
}
