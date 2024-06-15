import { recognize } from 'tesseract.js';

const imgElement = document.getElementsByClassName('col-sm-4')[0].querySelector('img');
const canvas = document.createElement('canvas');
canvas.width = imgElement.clientWidth;
canvas.height = imgElement.clientHeight;
const ctx = canvas.getContext('2d');
ctx.drawImage(imgElement, 0, 0, imgElement.clientWidth, imgElement.clientHeight);
const image = canvas.toDataURL();
const input = document.getElementById('ccode');

recognize(image, 'eng', {logger: e => console.log(e)})
    .then(out => {
        input.value = out.data.text;
    })
    .catch(err => {
        console.error("Error during recognition:", err);
    });