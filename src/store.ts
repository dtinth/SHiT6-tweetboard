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
  media?: Media;
  segments: { text: string; type: "text" | "link" }[];
  retweets: number;
  time: string;
  __event: any;
}

interface Media {
  width: number;
  height: number;
  url: string;
  media_key: string;
  preview_image_url?: string;
}

export const media = {} as Record<string, Media>;
export const tweets = writable([] as Tweet[]);
export const settings = writable({ options: {} } as Settings);
interface Settings {
  options: {
    iframe?: string;
  };
}

const socket = io("https://tweet-party.glitch.me/");
if ((window as any).socket) {
  (window as any).socket?.disconnect();
}
Object.assign(window, { socket });
socket.on("settings", (data) => {
  console.log("settings", data);
  settings.set(data);
});
socket.on("viewers", (viewers) => {
  console.log("viewers", viewers);
});
socket.on("broadcast", (broadcast) => {
  console.log("broadcast", broadcast);
  if (broadcast === "reload") {
    location.reload();
  }
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
    media?: Media[];
  };
}

function processTweet(event: TweetEvent) {
  if (event.data.created_at < "2022-06-29T20:28:00.000Z") {
    return;
  }
  for (const f of event.includes?.media || []) {
    media[f.media_key] = f;
  }
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
      text: link.display_url.startsWith("pic.twitter.com/")
        ? "????"
        : link.display_url,
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
    media: media[tweet.attachments?.media_keys?.[0]],
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
