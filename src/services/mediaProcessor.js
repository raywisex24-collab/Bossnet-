const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

/**
 * Processes video by adding text overlay and background music
 * @param {string} inputPath - Path to original video
 * @param {object} options - Text, coordinates, and audio path
 */
const processVideo = (inputPath, options) => {
  const outputPath = path.join(__dirname, 'temp', `processed_${Date.now()}.mp4`);

  ffmpeg(inputPath)
    .input(options.audioPath) // Add secondary audio input
    .complexFilter([
      // 1. Draw text on the video
      {
        filter: 'drawtext',
        options: {
          text: options.text,
          fontsize: 36,
          fontcolor: options.color,
          x: options.x, 
          y: options.y,
          shadowcolor: 'black',
          shadowx: 2,
          shadowy: 2
        },
        outputs: 'v1'
      },
      // 2. Mix original audio with new music
      {
        filter: 'amix',
        options: { inputs: 2, duration: 'first' },
        outputs: 'a1'
      }
    ], ['v1', 'a1'])
    .outputOptions([
      '-c:v libx264', // Video codec
      '-preset ultrafast', // Fast processing for mobile
      '-crf 28' // Compression level
    ])
    .on('start', (cmd) => console.log('Processing started: ' + cmd))
    .on('error', (err) => console.error('Error: ' + err.message))
    .on('end', () => console.log('Video export finished! Path: ' + outputPath))
    .save(outputPath);
};

