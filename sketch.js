// ml5.js: Pose Regression
// The Coding Train / Daniel Shiffman
// https://thecodingtrain.com/learning/ml5/7.3-pose-regression.html
// https://youtu.be/lob74HqHYJ0

// All code: https://editor.p5js.org/codingtrain/sketches/JI_j-PiLk

// Separated into three sketches
// 1: Data Collection: https://editor.p5js.org/codingtrain/sketches/Fe1ZNKw1Z
// 2: Model Training: https://editor.p5js.org/codingtrain/sketches/KLrIligVq
// 3: Model Deployment: https://editor.p5js.org/codingtrain/sketches/nejAYCA6N

let video;
let poseNet;
let pose;
let skeleton;

let brain;

let rSlider, gSlider, bSlider;
let position;
let state = 'waiting';
let postureLabel;
let recording = false;
let startRecording;
let stopRecording;
let mode = 'collecting';

function delay(time) {
  return new Promise((resolve, reject) => {
    if (isNaN(time)) {
      reject(new Error('delay requires a valid number.'));
    } else {
      setTimeout(resolve, time);
    }
  });
}


// this function for collect conrdinates and also set posture values
function start() {
  startRecording.classList.add('disable');
  startRecording.disabled = true;
  stopRecording.classList.remove('disable');
  stopRecording.disabled = false;
  let selectTag = document.getElementById('postures');
  position = selectTag.value;
  state = 'collecting';
  console.log('collecting');
}

// this function is for stop collecting conrdinates
function stop() {
  stopRecording.classList.add('disable');
  stopRecording.disabled = true;
  startRecording.classList.remove('disable');
  startRecording.disabled = false;
  state = 'waiting';
  console.log('not collecting');
}

// this function is for save the postures into json file

function saveData() {
  brain.saveData('postures');
}

// this function is for export the model files which is created by json file
function exportData() {
  brain.loadData('postures.json', trainModel);
}

// this function is for priview the results
function preview() {
  mode = 'preview';
  setup();
  let buttonsSection = document.getElementsByClassName('container');
  buttonsSection[0].style.display = 'none';
}

function setup() {
  
  startRecording = document.getElementById('start');
  stopRecording = document.getElementById('stop');
  
  
  createCanvas(300, 300);
  
  video = createCapture(VIDEO);
  video.remove();
  video.size(300, 300);
  poseNet = ml5.poseNet(video, modelLoaded);
  poseNet.on('pose', gotPoses);
  
  let options = {
    inputs: 34,
    outputs: 2,
    task: 'classification',
    debug: true
  };
  brain = ml5.neuralNetwork(options);
  
  if (mode === 'preview') {
    const modelInfo = {                    
      model: 'model/model.json',
      metadata: 'model/model_meta.json',
      weights: 'model/model.weights.bin',
    };
    brain.load(modelInfo, brainLoaded);
  }
}

function trainModel() {
  brain.normalizeData();
  let options = {
    epochs: 50
  };
  brain.train(options, finishedTraining);
}

function brainLoaded() {
  console.log('pose predicting ready!');
  predictPosition();
}

function finishedTraining() {
  brain.save();
  // predictPosition();
}

function predictPosition() {
  if (pose) {
    let inputs = [];
    for (let i = 0; i < pose.keypoints.length; i++) {
      let x = pose.keypoints[i].position.x;
      let y = pose.keypoints[i].position.y;
      inputs.push(x);
      inputs.push(y);
    }
    brain.classify(inputs, gotResult);
  } else {
    setTimeout(predictPosition, 100);
  }
}

function gotResult(error, results) {
  postureLabel = results[0].label;
  predictPosition();
}

function gotPoses(poses) {
  if (poses.length > 0) {
    pose = poses[0].pose;
    skeleton = poses[0].skeleton;
    if (state == 'collecting') {
      let inputs = [];
      for (let i = 0; i < pose.keypoints.length; i++) {
        let x = pose.keypoints[i].position.x;
        let y = pose.keypoints[i].position.y;
        inputs.push(x);
        inputs.push(y);
      }
      const posture = [position];
      brain.addData(inputs, posture);
    }
  }
}

function modelLoaded() {
  console.log('poseNet ready');
}


function draw() {
  push();
  translate(video.width, 0);
  scale(-1, 1);
  image(video, 0, 0, video.width, video.height);

  if (pose) {
    for (let i = 0; i < skeleton.length; i++) {
      let a = skeleton[i][0];
      let b = skeleton[i][1];
      strokeWeight(2);
      stroke(0);

      line(a.position.x, a.position.y, b.position.x, b.position.y);
    }
    for (let i = 0; i < pose.keypoints.length; i++) {
      let x = pose.keypoints[i].position.x;
      let y = pose.keypoints[i].position.y;
      fill(0);
      stroke(255);
      ellipse(x, y, 16, 16);
    }
  }
  pop();

 if (postureLabel) {
   const postureName = document.querySelector('.posture-name');
   if (postureLabel === "right position") {
     postureName.style.color = "#5cb85c";
   } else {
     postureName.style.color = '#d9534f';
   }
   postureName.innerHTML = postureLabel;
 }
}
