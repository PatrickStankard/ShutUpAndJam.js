var ShutUpAndJam;

/*
 * noise.js
 * white, pink, and brown noise generators for the web audio api
 * https://github.com/zacharydenton/noise.js
 *
 */

(function(AudioContext) {
  'use strict';

  AudioContext.prototype.createWhiteNoise = function(bufferSize) {
    var node;

    bufferSize = bufferSize || 4096;
    node = this.createScriptProcessor(bufferSize, 1, 1);

    node.onaudioprocess = function(e) {
      var output = e.outputBuffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    };

    return node;
  };

  AudioContext.prototype.createPinkNoise = function(bufferSize) {
    var b0, b1, b2, b3, b4, b5, b6, node;

    bufferSize = bufferSize || 4096;
    b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
    node = this.createScriptProcessor(bufferSize, 1, 1);

    node.onaudioprocess = function(e) {
      var output = e.outputBuffer.getChannelData(0);

      for (var i = 0; i < bufferSize; i++) {
        var white = Math.random() * 2 - 1;

        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11; // (roughly) compensate for gain
        b6 = white * 0.115926;
      }
    };

    return node;
  };

  AudioContext.prototype.createBrownNoise = function(bufferSize) {
    var lastOut, node;

    bufferSize = bufferSize || 4096;
    lastOut = 0.0;
    node = this.createScriptProcessor(bufferSize, 1, 1);

    node.onaudioprocess = function(e) {
      var output = e.outputBuffer.getChannelData(0);

      for (var i = 0; i < bufferSize; i++) {
        var white = Math.random() * 2 - 1;

        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // (roughly) compensate for gain
      }
    };

    return node;
  };
})(window.AudioContext || window.webkitAudioContext);

(function() {
  'use strict';

  ShutUpAndJam = function(params) {
    var self = this;

    self.context = new webkitAudioContext();

    self.quality = {
      setting: 2048,
      options: [
        256,
        512,
        1024,
        2048,
        4096,
        8192,
        16384
      ]
    };

    self.lfoKey = {
      white: false,
      pink: false,
      brown: false
    };

    self.selectors = {
      sliders: 'INPUT.jam-slider',
      quality: '#jam-quality',
      whiteVolume: '#jam-white-volume',
      pinkVolume: '#jam-pink-volume',
      brownVolume: '#jam-brown-volume',
      whiteLfoRate: '#jam-white-lfo-rate',
      pinkLfoRate: '#jam-pink-lfo-rate',
      brownLfoRate: '#jam-brown-lfo-rate',
      start: '#jam-start',
      stop: '#jam-stop'
    };

    if (params) {
      if (params.selectors) self.setSelectors(params.selectors, true);
      if (params.quality) self.setQuality(params.quality);
    }

    $(function() {
      self.setListeners();
      if (params && params.autoStart) self.startSound();
    });
  };

  ShutUpAndJam.prototype.resetValues = function() {
    this.brownGain.gain.value = 0;
    this.brownLfoGain.gain.value = 0;

    this.pinkGain.gain.value = 0;
    this.pinkLfoGain.gain.value = 0;

    this.whiteGain.gain.value = 0;
    this.whiteLfoGain.gain.value = 0;

    this.brownLfo.frequency.value = 0;
    this.pinkLfo.frequency.value = 0;
    this.whiteLfo.frequency.value = 0;
  };

  ShutUpAndJam.prototype.turnOn = function() {
    this.brownLfo = this.context.createOscillator();
    this.pinkLfo = this.context.createOscillator();
    this.whiteLfo = this.context.createOscillator();

    this.brownNoise = this.context.createBrownNoise(this.quality.setting);
    this.pinkNoise = this.context.createPinkNoise(this.quality.setting);
    this.whiteNoise = this.context.createWhiteNoise(this.quality.setting);

    this.brownLfoGain = this.context.createGainNode();
    this.pinkLfoGain = this.context.createGainNode();
    this.whiteLfoGain = this.context.createGainNode();

    this.brownGain = this.context.createGainNode();
    this.pinkGain = this.context.createGainNode();
    this.whiteGain = this.context.createGainNode();

    this.resetValues();
  };

  ShutUpAndJam.prototype.turnOff = function() {
    this.brownLfo = null;
    this.pinkLfo = null;
    this.whiteLfo = null;

    this.brownNoise = null;
    this.pinkNoise = null;
    this.whiteNoise = null;

    this.brownLfoGain = null;
    this.pinkLfoGain = null;
    this.whiteLfoGain = null;

    this.brownGain = null;
    this.pinkGain = null;
    this.whiteGain = null;
  };

  ShutUpAndJam.prototype.toggleBase = function(enable) {
    var x, y, z;

    if (enable) {
      this.turnOn();

      x = 'connect';
      y = 'start';
      z = 1;
    } else {
      x = 'disconnect';
      y = 'stop';
      z = 0;
    }

    this.brownLfoGain[x](this.brownGain.gain);
    this.pinkLfoGain[x](this.pinkGain.gain);
    this.whiteLfoGain[x](this.whiteGain.gain);

    this.brownGain[x](this.context.destination);
    this.pinkGain[x](this.context.destination);
    this.whiteGain[x](this.context.destination);

    this.brownLfo[x](this.brownLfoGain);
    this.pinkLfo[x](this.pinkLfoGain);
    this.whiteLfo[x](this.whiteLfoGain);

    this.brownNoise[x](this.brownGain);
    this.pinkNoise[x](this.pinkGain);
    this.whiteNoise[x](this.whiteGain);

    this.brownLfo[y](0);
    this.pinkLfo[y](0);
    this.whiteLfo[y](0);

    this.currentState = z;

    if (!enable) this.turnOff();
  };

  ShutUpAndJam.prototype.volumeBase = function(x, y) {
    var mainVol, lfoVol;

    mainVol = this.updateValue(x);
    lfoVol = 0;

    if (this.lfoKey[y]) {
      mainVol = (mainVol / 2);
      lfoVol = mainVol;
    }

    return ([mainVol, lfoVol]);
  };

  ShutUpAndJam.prototype.stopSound = function() {
    if (this.currentState === 0) {
      this.startSound();
    }

    this.toggleBase(false);
  };

  ShutUpAndJam.prototype.startSound = function() {
    var self = this;

    if (this.currentState === 1) {
      this.stopSound();
    }

    this.toggleBase(true);

    $(this.selectors.sliders).each(function() {
      if ($(this).attr('id') !== self.selectors.quality) {
        $(this).trigger('change');
      }
    });
  };

  ShutUpAndJam.prototype.updateValue = function(that, skipTransform) {
    var value = $(that).val() || 0;

    if (skipTransform) return value;
    return value * 0.1;
  };

  ShutUpAndJam.prototype.setQuality = function(quality) {
    var self = this;

    quality = parseInt(quality, 10);

    if (quality && !isNaN(quality)) {
      self.quality.options.forEach(function(valid) {
        if (quality === valid) {
          self.quality.setting = quality;
        }
      });
    }
  };

  ShutUpAndJam.prototype.setSelectors = function(selectors, init) {
    if (!init) this.removeListeners();

    selectors.forEach(function(x) {
      if (this.selectors[x]) {
        this.selectors[x] = selectors[x];
      }
    });

    if (!init) this.setListeners();
  };

  ShutUpAndJam.prototype.setListeners = function() {
    var self = this;

    $(self.selectors.quality).on('change.suaj', function() {
      var quality = self.updateValue(this, true);

      quality = self.quality.options[quality];

      self.setQuality(quality);
      self.startSound();
    });

    $(self.selectors.whiteVolume).on('change.suaj', function() {
      var vol = self.volumeBase(this, 'white');

      self.whiteGain.gain.value = vol[0];
      self.whiteLfoGain.gain.value = vol[1];
    });

    $(self.selectors.pinkVolume).on('change.suaj', function() {
      var vol = self.volumeBase(this, 'pink');

      self.pinkGain.gain.value = vol[0];
      self.pinkLfoGain.gain.value = vol[1];
    });

    $(self.selectors.brownVolume).on('change.suaj', function() {
      var vol = self.volumeBase(this, 'brown');

      self.brownGain.gain.value = vol[0];
      self.brownLfoGain.gain.value = vol[1];
    });

    $(self.selectors.whiteLfoRate).on('change.suaj', function() {
      var rate = self.updateValue(this);

      self.whiteLfo.frequency.value = rate;
      self.lfoKey.white = (rate !== 0);

      $(self.selectors.whiteVolume).trigger('change.suaj');
    });

    $(self.selectors.pinkLfoRate).on('change.suaj', function() {
      var rate = self.updateValue(this);

      self.pinkLfo.frequency.value = rate;
      self.lfoKey.pink = (rate !== 0);

      $(self.selectors.pinkVolume).trigger('change.suaj');
    });

    $(self.selectors.brownLfoRate).on('change.suaj', function() {
      var rate = self.updateValue(this);

      self.brownLfo.frequency.value = self.updateValue(this);
      self.lfoKey.brown = (rate !== 0);

      $(self.selectors.brownVolume).trigger('change.suaj');
    });

    $(self.selectors.start).on('click.suaj', function() {
      self.startSound();
    });

    $(self.selectors.stop).on('click.suaj', function() {
      self.stopSound();
    });
  };

  ShutUpAndJam.prototype.removeListeners = function() {
    for (var x in this.selectors) {
      $(this.selectors[x]).off('change.suaj click.suaj');
    }
  };
})();

