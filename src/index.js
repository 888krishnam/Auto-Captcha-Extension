import { recognize } from 'tesseract.js';

const logger = (message) => {
    console.log(message);
};

const image = document.getElementsByClassName('col-sm-4')[0].querySelector('img').src;
console.log("image ==> ",image)
const input = document.getElementById('ccode');
console.log("input ==> ",input)

recognize(image, 'eng', {logger: e => console.log(e)})
    .then(out => {
        console.log("out ==> ",out.data.text)
        input.value = out.data.text;
    })
    .catch(err => {
        console.error("Error during recognition:", err);
    });