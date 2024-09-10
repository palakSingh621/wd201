// ----------------File System & stream-----------------------------------------
// const http=require("http");
// const fs=require("fs");

// const server=http.createServer((req,res)=>{

//     const stream=fs.createReadStream("sample.txt");
//     stream.pipe(res);
//     // fs.readFile("sample.txt",(err,data)=>{
//     //     res.end(data);
//     // })
// })

// server.listen(3000);
// -----------------------------------------------------------------------------------

// import { ESLint } from "eslint";

// const arr=process.argv;
// const num1=parseInt(arr[2]);
// const num2=parseInt(arr[3]);
// console.log(`sum:${num1+num2}`);

// console.log(arr[0]);
// console.log(arr[1]);
// console.log(arr[2]);
// console.log(arr[3]);

const minimist=require("minimist");

// const arr=minimist(process.argv.slice(2));

// const nums1=parseInt(arr.nums1);

// const nums2=parseInt(arr.nums2);

// const operation=arr.operation;

// if(operation==='add'){
//     console.log(`sum: ${nums1+nums2}`);
// }else if(operation==='sub'){
//     console.log(`difference: ${nums1-nums2}`);
// }else if(operation==='mult'){
//     console.log(`prod: ${nums1*nums2}`);
// }else{
//     console.log("Unknown");
// }


const args = minimist(process.argv.slice(2), {
    alias: {
      num1: 'n1',
      num2: 'n2'
    }
  });
  
  console.log(`Num1 is: ${args.num1}`); 