let CURRENT_URI;

if (process.env.NODE_ENV === "production") {
  CURRENT_URI = "http://18.185.85.91";
} else {
  CURRENT_URI = "http://localhost:4000";
}

const HASHTAG ='Zilliqa';

export { CURRENT_URI, HASHTAG };
