import express from "express";
import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import ffmpegCommand from'fluent-ffmpeg';
import { IncomingForm } from "formidable";
import config from "./config"

const app = express();

//用body parser 来解析post和url信息中的参数
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(bodyParser.json());

//基础路由
app.get(config.API_HOST, (req, res) => {
    res.redirect('/index');
});

//静态资源托管
app.use(config.API_HOST + 'static', express.static('static'));

const UPLOAD_DIR = path.resolve(__dirname, `./upload`);
//下载目录
try{
  fs.accessSync(UPLOAD_DIR);
}catch(e){
  fs.mkdirSync(UPLOAD_DIR);
}

//上传视频
app.post(config.API_HOST + 'upload/:id', (req, res) => {
  let form = new IncomingForm();
  form.encoding = "utf-8"; //设置编辑
  form.uploadDir = UPLOAD_DIR;
  form.keepExtensions = true; //保留后缀
  form.multiples = false; // 上传多个
  form.maxFieldsSize = 2 * 1024 * 1024; //文件大小 2M
  // 上传文件的入口文件
  form.parse(req, (err, data, { blob: file }) => {
    if (err) {
      console.log(err);
      res.send({
        code: -200,
        message: "上传失败"
      });
    } else {
      res.send({
        code: 200,
        message: "上传成功"
      });
      
      const videoDir = path.resolve(__dirname, `../static/video/${req.params.id}`);
      //创建目录
      try{
        fs.accessSync(videoDir)
      }catch(e){
        fs.mkdirSync(videoDir);
      }

      //转码
      const playlistPath = `${videoDir}/playlist.m3u8`;
      
      ffmpegCommand(file.path)
        .addOption('-hls_time', '5')   //设置每个片段的长度
        .addOption('-start_number', Date.now()>>>6)
        //.addOption('-f', 'hls')
        //.addOption('-hls_key_info_file', _keyInfoPath)
        .save(playlistPath)
        .on('error', error => {
          //console.log(error);
          console.log('ffmpeg faile');
          fs.unlink(file.path, err => {});
        })
        .on('end', (err, data) => {
          //修改文件为直播方式
          fs.readFile(playlistPath, (err, data)=>{
            if(!err) fs.writeFile(playlistPath, data.toString().replace('#EXT-X-ENDLIST', ''));
          });
          //删除视频
          fs.unlink(file.path, err => {});
          
        }).run();
    }
  });
})

//首页
app.get(config.API_HOST + "index", (req, res) => {
  fs.readFile(path.resolve(__dirname, "./template/index.html"), (err, data)=>{
    fs.readdir(path.resolve(__dirname, '../static/video'), (err, files) => {
      let html = '暂无直播视频';
      if(!err && files.length>0){
        html = files.map(id => /^[\d]*$/.test(id)?`<a href="./live?id=${id}"><div class="item"><p>主播ID-${id}</p></div></a>`:'').join('');
      }
      res.send(data.toString().replace('{{live-list}}', html));
    })
  });
});

//其他模板文件
app.get(config.API_HOST + ":module", (req, res) => res.sendFile(path.resolve(__dirname, "./template/" + req.params.module + ".html")));
  
// 启动服务
app.listen(config.PORT);
console.log("Magic happens at http://localhost:" + config.PORT);