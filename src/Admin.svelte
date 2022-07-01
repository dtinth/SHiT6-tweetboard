<script lang="ts">
  import { tweets } from "./store";
  import axios from "axios";
</script>

<ul class="pl-6 list-disc">
  {#each $tweets.slice(0, 16) as tweet (tweet.id)}
    <li>
      <strong>{tweet.name}</strong>
      @{tweet.username}<span class="text-xs">{" "}&middot; {tweet.time}</span>
      <div class="pl-4">
        {#each tweet.segments as segment}
          <span class:text-sky-300={segment.type != "text"}>{segment.text}</span
          >
        {/each}
      </div>
    </li>
  {/each}
</ul>
