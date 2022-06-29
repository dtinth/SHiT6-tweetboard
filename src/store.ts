import { writable } from "svelte/store";
import { io } from "socket.io-client";
import { queryParams } from "./queryParams";

class Throttler {
  private nextTime = 0;
  constructor(public delay: number) {}
  public throttle(fn: () => void) {
    if (!this.delay || Date.now() > this.nextTime) {
      fn();
      this.nextTime = Date.now() + this.delay;
    } else {
      setTimeout(() => fn(), this.nextTime - Date.now());
      this.nextTime += this.delay;
    }
  }
}

const throttler = new Throttler(+queryParams.get("throttle") || 0);

export interface Tweet {
  id: string;
  href: string;
  text: string;
  avatar: string;
  name: string;
  username: string;
  segments: { text: string; type: "text" | "link" }[];
  retweets: number;
  time: string;
  __event: any;
}

export const tweets = writable([] as Tweet[]);

const socket = io("https://tweet-party.glitch.me/");
if ((window as any).socket) {
  (window as any).socket?.disconnect();
}
Object.assign(window, { socket });
socket.on("settings", (settings) => {
  console.log("settings", settings);
});
socket.on("viewers", (viewers) => {
  console.log("viewers", viewers);
});
socket.on("tweet", (event) => {
  if (event.system_message) {
    processSystemMessage(event);
  } else if (event.data) {
    processTweet(event);
  }
});

interface SystemMessageEvent {
  system_message: "server_start" | "start_stream";
}

function processSystemMessage(event: SystemMessageEvent) {}

interface TwitterTweet {
  text: string;
  author_id: string;
  created_at: string;
  id: string;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
  entities: {
    mentions?: {
      start: number;
      end: number;
      username: string;
      id: string;
    }[];
    hashtags?: {
      start: number;
      end: number;
      tag: string;
    }[];
    urls?: {
      start: number;
      end: number;
      url: string;
      expanded_url: string;
      display_url: string;
    }[];
    annotations?: {
      start: number;
      end: number;
      normalized_text: string;
      probability: number;
      type: string;
    };
  };
  attachments?: {
    media_keys: string[];
  };
  referenced_tweets: {
    type: "retweeted" | "replied_to";
    id: string;
  }[];
}

interface TweetEvent {
  data: TwitterTweet;
  includes: {
    users?: {
      created_at: string;
      id: string;
      name: string;
      profile_image_url: string;
      username: string;
    }[];
    tweets?: TwitterTweet[];
  };
}

function processTweet(event: TweetEvent) {
  const segments: Tweet["segments"] = [];
  const links: { start: number; end: number; text: string }[] = [];
  let tweet = event.data;
  const retweetedTweetId = event.data.referenced_tweets?.find(
    (r) => r.type === "retweeted"
  )?.id;
  if (retweetedTweetId) {
    const retweetedTweet = event.includes.tweets.find(
      (t) => t.id === retweetedTweetId
    );
    if (retweetedTweet) {
      tweet = retweetedTweet;
    }
  }
  const user = event.includes.users.find((user) => user.id === tweet.author_id);
  if (!user) {
    return;
  }
  for (const mention of tweet.entities.mentions || []) {
    links.push({
      start: mention.start,
      end: mention.end,
      text: `@${mention.username}`,
    });
  }
  for (const mention of tweet.entities.hashtags || []) {
    links.push({
      start: mention.start,
      end: mention.end,
      text: `#${mention.tag}`,
    });
  }
  for (const link of tweet.entities.urls || []) {
    links.push({
      start: link.start,
      end: link.end,
      text: link.display_url,
    });
  }
  links.sort((a, b) => a.start - b.start);
  let lastEnd = 0;
  const text = [...tweet.text];
  for (const link of links) {
    if (link.start > lastEnd) {
      segments.push({
        text: text.slice(lastEnd, link.start).join(""),
        type: "text",
      });
    }
    segments.push({
      text: link.text,
      type: "link",
    });
    lastEnd = link.end;
  }
  if (lastEnd < text.length) {
    segments.push({
      text: text.slice(lastEnd).join(""),
      type: "text",
    });
  }
  const newTweet: Tweet = {
    id: tweet.id,
    href: `https://twitter.com/${user.username}/status/${tweet.id}`,
    text: tweet.text,
    avatar: user.profile_image_url,
    name: user.name,
    username: user.username,
    segments,
    time: new Date(Date.parse(tweet.created_at) + 7 * 3600e3)
      .toISOString()
      .slice(11, 19),
    __event: event,
    retweets: tweet.public_metrics.retweet_count,
  };
  throttler.throttle(() => {
    tweets.update((tweets) => {
      return [newTweet, ...tweets.filter((t) => t.id !== newTweet.id)];
    });
  });
}
