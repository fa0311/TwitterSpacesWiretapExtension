class TwitterSpacesWiretap {
  constructor() {
    this.AUTHORIZATION =
      "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
  }

  getHeaders() {
    let cookie = this.getCookieArray();
    let headers = {
      authorization: this.AUTHORIZATION,
      "Content-type": "application/json",
      "x-csrf-token": cookie["ct0"],
      "x-twitter-active-user": "yes",
      "x-twitter-client-language": "ja",
    };
    if (cookie["gt"] != undefined) {
      headers = { ...headers, ...{ "x-guest-token": cookie["gt"] } };
    }
    return headers;
  }

  getCookieArray() {
    let arr = new Array();
    if (document.cookie != "") {
      let tmp = document.cookie.split("; ");
      for (let i = 0; i < tmp.length; i++) {
        let data = tmp[i].split("=");
        arr[data[0]] = decodeURIComponent(data[1]);
      }
    }
    return arr;
  }

  async AudioSpaceById(id) {
    let url = new URL(
      "https://twitter.com/i/api/graphql/Uv5R_-Chxbn1FEkyUkSW2w/AudioSpaceById"
    );
    let params = new URLSearchParams({
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

    let response = await fetch(url.toString() + "?" + params.toString(), {
      headers: this.getHeaders(),
      method: "GET",
    });
    return await response.json();
  }

  async live_video_stream(media_key) {
    let url = new URL(
      "https://twitter.com/i/api/1.1/live_video_stream/status/" + media_key
    );
    let params = new URLSearchParams({
      client: "web",
      use_syndication_guest_id: false,
      cookie_set_host: "twitter.com",
    });

    let response = await fetch(url.toString() + "?" + params.toString(), {
      headers: this.getHeaders(),
      method: "GET",
    });
    return await response.json();
  }
}

new MutationObserver(async () => {
  href = location.href;
  if (href.match(new RegExp("https://twitter.com/i/spaces/")) == null) return;
  if (document.getElementById("twitter-spaces-wiretap-audio") != null) return;

  const audio = document.createElement("audio");
  audio.setAttribute("controls", "");
  audio.id = "twitter-spaces-wiretap-audio";

  let element;
  let hrefList = href.split("?")[0].split("/");
  let id = hrefList.slice(-1)[0];
  if (id == "peek") {
    id = hrefList.slice(-2)[0];
    element = document.querySelector(
      'div[role="menu"] div[aria-haspopup="menu"]'
    );
    if (element == null) return;
    element.parentNode.parentNode.prepend(audio);
  } else {
    element = document.querySelector(
      'div[data-testid="placementTracking"] div[role="button"] > div > div'
    );
    if (element == null) return;
    element.append(audio);
  }

  console.log(id);

  let space = new TwitterSpacesWiretap();
  let media_key = (await space.AudioSpaceById(id)).data.audioSpace.metadata
    .media_key;
  let url = (await space.live_video_stream(media_key)).source.location;
  console.log(url);

  if (Hls.isSupported()) {
    let hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(audio);
    audio.play();
  } else if (audio.canPlayType("application/vnd.apple.mpegurl")) {
    audio.src = url;
  }
}).observe(document, { childList: true, subtree: true });
