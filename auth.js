const JWT = require("jsonwebtoken")

const authenticate = async (req,res,next)=>{ //middleware
    try {
        const bearer = await req.headers["authorization"];
        if(!bearer) return res.json({message:"access failed"})
        JWT.verify(bearer,process.env.PRIVATEKEY,(err,decode)=>{
            if(res){
                req.body.auth = decode;
                next();
            }
            else res.json({message:"authentication failed"})
        })
    } catch (error) {
        return res.json({
            message:"something went wrong authentication"
        })
    }
 }

module.exports = {authenticate}