const sharp=require('sharp');
// A uniform canvas preserves the entire product, including narrow/tall uploads.
module.exports=buffer=>sharp(buffer,{limitInputPixels:40000000}).rotate().resize(1000,1000,{fit:'contain',background:'#ffffff'}).flatten({background:'#ffffff'}).webp({quality:82});
