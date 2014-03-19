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

(function(window, document, $, undefined) {
  'use strict';

  window.ShutUpAndJam = function(params) {
    this.context = new webkitAudioContext();

    this.quality = {
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

    this.lfoKey = {
      white: false,
      pink: false,
      brown: false
    };

    this.selectors = {
      sliders: 'input.jam-slider',
      quality: 'input#jam-quality',
      whiteVolume: 'input#jam-white-volume',
      pinkVolume: 'input#jam-pink-volume',
      brownVolume: 'input#jam-brown-volume',
      whiteLfoRate: 'input#jam-white-lfo-rate',
      pinkLfoRate: 'input#jam-pink-lfo-rate',
      brownLfoRate: 'input#jam-brown-lfo-rate',
      start: 'input#jam-start',
      stop: 'input#jam-stop'
    };

    if (typeof params === 'object') {
      if (typeof params.selectors === 'object') {
        this.setSelectors(params.selectors, true);
      }

      if (typeof params.quality === 'object') {
        this.setQuality(params.quality);
      }
    }

    $(function() {
      this.setListeners();

      if (typeof params === 'object') {
        if (params.autoStart === true) {
          this.startSound();
        }
      }
    }.bind(this));
  };

  window.ShutUpAndJam.prototype.resetValues = function() {
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

  window.ShutUpAndJam.prototype.turnOn = function() {
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

  window.ShutUpAndJam.prototype.turnOff = function() {
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

  window.ShutUpAndJam.prototype.toggleBase = function(enable) {
    var x, y, z;

    if (enable === true) {
      this.turnOn();

      x = 'connect';
      y = 'start';
      z = 1;
    } else if (enable === false) {
      x = 'disconnect';
      y = 'stop';
      z = 0;
    } else {
      return;
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

    if (enable === false) {
      this.turnOff();
    }
  };

  window.ShutUpAndJam.prototype.volumeBase = function(x, y) {
    var mainVol, lfoVol;

    mainVol = this.updateValue(x);
    lfoVol = 0;

    if (typeof this.lfoKey[y] !== 'undefined') {
      mainVol = (mainVol / 2);
      lfoVol = mainVol;
    }

    return ([mainVol, lfoVol]);
  };

  window.ShutUpAndJam.prototype.stopSound = function() {
    if (this.currentState === 0) {
      this.startSound();
    }

    this.toggleBase(false);
  };

  window.ShutUpAndJam.prototype.startSound = function() {
    if (this.currentState === 1) {
      this.stopSound();
    }

    this.toggleBase(true);

    $(this.selectors.sliders).each(function(i, el) {
      if ($(el).attr('id') !== this.selectors.quality) {
        $(el).trigger('change');
      }
    }.bind(this));
  };

  window.ShutUpAndJam.prototype.updateValue = function(that, skipTransform) {
    var value = $(that).val() || 0;

    if (skipTransform === true) {
      return value;
    }

    return value * 0.1;
  };

  window.ShutUpAndJam.prototype.setQuality = function(quality) {
    quality = parseInt(quality, 10);

    if (isNaN(quality) === false && quality !== 0) {
      this.quality.options.forEach(function(valid) {
        if (quality === valid) {
          this.quality.setting = quality;
        }
      }.bind(this));
    }
  };

  window.ShutUpAndJam.prototype.setSelectors = function(selectors, init) {
    if (init !== true) {
      this.removeListeners();
    }

    selectors.forEach(function(x) {
      if (typeof this.selectors[x] !== 'undefined') {
        this.selectors[x] = selectors[x];
      }
    }.bind(this));

    if (init !== true) {
      this.setListeners();
    }
  };

  window.ShutUpAndJam.prototype.setListeners = function() {
    $(this.selectors.quality).on('change.suaj', function(e) {
      var quality = this.updateValue(e.currentTarget, true);

      quality = this.quality.options[quality];

      this.setQuality(quality);
      this.startSound();
    }.bind(this));

    $(this.selectors.whiteVolume).on('change.suaj', function(e) {
      var vol = this.volumeBase(e.currentTarget, 'white');

      this.whiteGain.gain.value = vol[0];
      this.whiteLfoGain.gain.value = vol[1];
    }.bind(this));

    $(this.selectors.pinkVolume).on('change.suaj', function(e) {
      var vol = this.volumeBase(e.currentTarget, 'pink');

      this.pinkGain.gain.value = vol[0];
      this.pinkLfoGain.gain.value = vol[1];
    }.bind(this));

    $(this.selectors.brownVolume).on('change.suaj', function(e) {
      var vol = this.volumeBase(e.currentTarget, 'brown');

      this.brownGain.gain.value = vol[0];
      this.brownLfoGain.gain.value = vol[1];
    }.bind(this));

    $(this.selectors.whiteLfoRate).on('change.suaj', function(e) {
      var rate = this.updateValue(e.currentTarget);

      this.whiteLfo.frequency.value = rate;
      this.lfoKey.white = (rate !== 0);

      $(this.selectors.whiteVolume).trigger('change.suaj');
    }.bind(this));

    $(this.selectors.pinkLfoRate).on('change.suaj', function(e) {
      var rate = this.updateValue(e.currentTarget);

      this.pinkLfo.frequency.value = rate;
      this.lfoKey.pink = (rate !== 0);

      $(this.selectors.pinkVolume).trigger('change.suaj');
    }.bind(this));

    $(this.selectors.brownLfoRate).on('change.suaj', function(e) {
      var rate = this.updateValue(e.currentTarget);

      this.brownLfo.frequency.value = this.updateValue(e.currentTarget);
      this.lfoKey.brown = (rate !== 0);

      $(this.selectors.brownVolume).trigger('change.suaj');
    }.bind(this));

    $(this.selectors.start).on('click.suaj', function() {
      this.startSound();
    }.bind(this));

    $(this.selectors.stop).on('click.suaj', function() {
      this.stopSound();
    }.bind(this));
  };

  window.ShutUpAndJam.prototype.removeListeners = function() {
    for (var x in this.selectors) {
      $(this.selectors[x]).off('change.suaj click.suaj');
    }
  };
})(window, document, jQuery);

