class TwitterSpacesWiretap {
  constructor() {
    this.ORIGIN = location.origin;
    this.AUTHORIZATION =
      "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
  }

  getHeaders() {
    const cookie = this.getCookieArray();
    const headers = {
      authorization: this.AUTHORIZATION,
      "Content-type": "application/json",
      "x-csrf-token": cookie["ct0"],
      "x-twitter-active-user": "yes",
      "x-twitter-client-language": "en",
    };
    if (cookie["gt"] == undefined) {
      return headers;
    } else {
      return { ...headers, ...{ "x-guest-token": cookie["gt"] } };
    }
  }

  getCookieArray() {
    const arr = new Array();
    if (document.cookie != "") {
      const tmp = document.cookie.split("; ");
      Array.from({ length: tmp.length }, (_, i) => {
        const data = tmp[i].split("=");
        arr[data[0]] = decodeURIComponent(data[1]);
      });
    }
    return arr;
  }

  async AudioSpaceById(id) {
    const url = new URL(this.ORIGIN + "/i/api/graphql/Uv5R_-Chxbn1FEkyUkSW2w/AudioSpaceById");
    const params = new URLSearchParams({
      variables: JSON.stringify({
        id: id,
        isMetatagsQuery: true,
        withSuperFollowsUserFields: true,
        withBirdwatchPivots: false,
        withDownvotePerspective: false,
        withReactionsMetadata: false,
        withReactionsPerspective: false,
        withSuperFollowsTweetFields: true,
        withReplays: true,
        withScheduledSpaces: true,
      }),
    });

    const response = await fetch(url.toString() + "?" + params.toString(), {
      headers: this.getHeaders(),
      method: "GET",
    });
    return await response.json();
  }

  async live_video_stream(media_key) {
    const url = new URL(this.ORIGIN + "/i/api/1.1/live_video_stream/status/" + media_key);
    const params = new URLSearchParams({
      client: "web",
      use_syndication_guest_id: false,
      cookie_set_host: "twitter.com",
    });

    const response = await fetch(url.toString() + "?" + params.toString(), {
      headers: this.getHeaders(),
      method: "GET",
    });
    return await response.json();
  }
}

new MutationObserver(async () => {
  this.origin = location.origin;
  const href = location.href;
  if (href.match(new RegExp(origin + "/i/spaces/")) == null) return;
  if (document.getElementById("twitter-spaces-wiretap-audio") != null) return;

  const audio = document.createElement("audio");
  audio.setAttribute("controls", "");
  audio.id = "twitter-spaces-wiretap-audio";

  const hrefList = href.split("?")[0].split("/");
  const [peek, id] = hrefList.reverse();
  if (peek == "peek") {
    const element = document.querySelector(
      'div[data-testid="sheetDialog"] > div > div > div > button'
    );
    if (element == null) return;
    element.parentNode.parentNode.insertBefore(audio, element.parentNode.nextElementSibling);
  }

  console.log(id);

  const space = new TwitterSpacesWiretap();
  const media_key = (await space.AudioSpaceById(id)).data.audioSpace.metadata
    .media_key;
  const url = (await space.live_video_stream(media_key)).source.location;
  console.log(url);

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(audio);
    audio.play();
  } else if (audio.canPlayType("application/vnd.apple.mpegurl")) {
    audio.src = url;
  }
}).observe(document, { childList: true, subtree: true });
