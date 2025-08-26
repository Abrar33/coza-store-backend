const mongoose=require("mongoose")
const schema=new mongoose.Schema({
    name:{type:String,},
    email:{type:String,required:true},
    password:{type:String,required:true},
    role:{type:String,
        enum:["admin","seller","buyer","manager","user"],
        default:"buyer"},
             otp: {
    type: String,
  },
  otpCreatedAt: {
    type: Date,
  },
  otpExpiry: { type: Date }, 
  isEmailVerified: {
    type: Boolean,
    default: false,
  }},
{
    // This is the key change!
    // Mongoose will automatically add 'createdAt' and 'updatedAt' fields.
    timestamps: true,
  }
)
module.exports=mongoose.model("User", schema);