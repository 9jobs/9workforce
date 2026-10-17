export default function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  return res.status(200).json({googleEnabled:Boolean(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET)});
}
