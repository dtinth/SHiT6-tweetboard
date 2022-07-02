<script lang="ts">
  import { media, settings, tweets } from "./store";
  import { flip } from "svelte/animate";
  import { fade, fly } from "svelte/transition";
  import { queryParams } from "./queryParams";

  const leftOnly = queryParams.get("mode") === "left";
</script>

<main class="p-8 max-w-[28rem]">
  {#each $tweets.slice(0, 16) as tweet (tweet.id)}
    <div
      in:fly={{ x: 100, duration: 256 }}
      animate:flip={{ duration: 256 }}
      class="mb-4 border border-gray-600 rounded-lg overflow-hidden"
      on:click={() => console.log(tweet)}
    >
      <div class="p-4">
        <div class="flex items-center">
          <img
            src={tweet.avatar}
            alt=""
            class="w-8 h-8 rounded-full flex-none"
          />
          <div class="text-sm flex-1 mx-2 leading-tight">
            <strong>{tweet.name}</strong>
            <div class="opacity-60">
              @{tweet.username}<span class="text-xs"
                >{" "}&middot; {tweet.time}</span
              >
            </div>
          </div>
          <div class="flex-none self-start opacity-40">
            <a href={tweet.href}>
              <svg viewBox="0 0 24 24" aria-hidden="true" class="w-6 h-6">
                <g>
                  <path
                    fill="currentColor"
                    d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"
                  />
                </g>
              </svg>
            </a>
          </div>
        </div>
        <p class="text-xl mt-2">
          {#each tweet.segments as segment}
            <span class:text-sky-300={segment.type != "text"}
              >{segment.text}</span
            >
          {/each}
        </p>
        {#if tweet.retweets > 0}
          <div class="text-gray-400 mt-2 flex gap-2 items-center">
            <svg viewBox="0 0 24 24" aria-hidden="true" class="w-4 h-4">
              <g>
                <path
                  fill="currentColor"
                  d="M23.77 15.67c-.292-.293-.767-.293-1.06 0l-2.22 2.22V7.65c0-2.068-1.683-3.75-3.75-3.75h-5.85c-.414 0-.75.336-.75.75s.336.75.75.75h5.85c1.24 0 2.25 1.01 2.25 2.25v10.24l-2.22-2.22c-.293-.293-.768-.293-1.06 0s-.294.768 0 1.06l3.5 3.5c.145.147.337.22.53.22s.383-.072.53-.22l3.5-3.5c.294-.292.294-.767 0-1.06zm-10.66 3.28H7.26c-1.24 0-2.25-1.01-2.25-2.25V6.46l2.22 2.22c.148.147.34.22.532.22s.384-.073.53-.22c.293-.293.293-.768 0-1.06l-3.5-3.5c-.293-.294-.768-.294-1.06 0l-3.5 3.5c-.294.292-.294.767 0 1.06s.767.293 1.06 0l2.22-2.22V16.7c0 2.068 1.683 3.75 3.75 3.75h5.85c.414 0 .75-.336.75-.75s-.337-.75-.75-.75z"
                />
              </g>
            </svg>
            {tweet.retweets}
          </div>
        {/if}
      </div>

      {#if tweet.media}
        <div class="relative [aspect-ratio:4/3] overflow-hidden">
          <img
            src={tweet.media.preview_image_url || tweet.media.url}
            alt=""
            class="absolute inset-0 w-full h-full object-cover blur-lg opacity-50"
          />
          <img
            src={tweet.media.preview_image_url || tweet.media.url}
            alt=""
            class="absolute inset-0 w-full h-full object-contain"
          />
        </div>
      {/if}
    </div>
  {/each}
</main>

{#if !leftOnly}
  {#if $settings.options.iframe}
    <div class="fixed left-[28rem] inset-y-0 right-0">
      <iframe
        src={$settings.options.iframe}
        title="whiteboard"
        class="absolute top-0 left-0 w-full h-full"
      />
    </div>
  {/if}
{/if}
