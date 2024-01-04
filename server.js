const app = require('./app');




//server
app.listen(process.env.PORT,()=>{
    console.log(`Server is working on PORT : ${process.env.PORT}`)
})