class Agora {
    rtc = {
        client: null,
        joined: false,
        published: false,
        localStream: null,
        remoteStreams: [],
        params: {}
    }

    option = {
        mode: 'live', // 'live' | 'rtc'
        codec: 'h264', // 'h264' | 'vp8'
        appID: null,
        channel: null,
        uid: null,
        token: null
    }

    constructor(appId, tokenId, bookingId) {
        console.log("agora sdk version: " + AgoraRTC.VERSION + " compatible: " + AgoraRTC.checkSystemRequirements());

        this.option.appID = appId
        this.option.token  = tokenId
        this.option.channel = bookingId
        this.rtc.client = AgoraRTC.createClient({mode: this.option.mode, codec: this.option.codec})
        this.rtc.params = this.option;

        this.initClient()
    }

    initClient() {
        let scope = this;
        // init client
        this.rtc.client.init(this.option.appID, function () {
            console.log("init success");

            /**
             * Joins an AgoraRTC Channel
             * This method joins an AgoraRTC channel.
             * Parameters
             * tokenOrKey: string | null
             *    Low security requirements: Pass null as the parameter value.
             *    High security requirements: Pass the string of the Token or Channel Key as the parameter value. See Use Security Keys for details.
             *  channel: string
             *    A string that provides a unique channel name for the Agora session. The length must be within 64 bytes. Supported character scopes:
             *    26 lowercase English letters a-z
             *    26 uppercase English letters A-Z
             *    10 numbers 0-9
             *    Space
             *    "!", "#", "$", "%", "&", "(", ")", "+", "-", ":", ";", "<", "=", ".", ">", "?", "@", "[", "]", "^", "_", "{", "}", "|", "~", ","
             *  uid: number | null
             *    The user ID, an integer. Ensure this ID is unique. If you set the uid to null, the server assigns one and returns it in the onSuccess callback.
             *   Note:
             *      All users in the same channel should have the same type (number or string) of uid.
             *      If you use a number as the user ID, it should be a 32-bit unsigned integer with a value ranging from 0 to (232-1).
             **/
            scope.rtc.client.join(scope.option.token ? scope.option.token : null, scope.option.channel, scope.option.uid ? +scope.option.uid : null, function (uid) {
                //Toast.notice("join channel: " + option.channel + " success, uid: " + uid);
                console.log("join channel: " + scope.option.channel + " success, uid: " + uid);
                scope.rtc.joined = true;

                scope.rtc.params.uid = uid;

                // create local stream
                scope.rtc.localStream = AgoraRTC.createStream({
                    streamID: scope.rtc.params.uid,
                    audio: true,
                    video: true,
                    screen: false,
                    microphoneId: scope.option.microphoneId,
                    cameraId: scope.option.cameraId
                })

                // init local stream
                scope.rtc.localStream.init(function () {
                    console.log("init local stream success");
                    // play stream with html element id "local_stream"
                    scope.rtc.localStream.play("local_stream")

                    // publish local stream
                    scope.publish(scope.rtc);
                }, function (err)  {
                    console.error("init local stream failed ", err);
                })
            }, function(err) {
                console.error("client join failed", err)
            })
        }, (err) => {
            console.error(err);
        });
    }


    joinSession() {
        this.rtc.client.on("stream-subscribed", function (evt) {
            var remoteStream = evt.stream;
            var id = remoteStream.getId();
            rtc.remoteStreams.push(remoteStream);
            this.addView(id);
            remoteStream.play("remote_video_" + id);
            Toast.info('stream-subscribed remote-uid: ' + id);
            console.log('stream-subscribed remote-uid: ', id);
        })
    }

    publish (rtc) {
        var scope = this;
        if (!rtc.client) {
            console.log("Please Join Room First");
            return;
        }
        if (rtc.published) {
            console.log("Please Join Room First");
            return;
        }
        var oldState = rtc.published;

        // publish localStream
        rtc.client.publish(rtc.localStream, function (err) {
            scope.rtc.published = oldState;
            console.log("publish failed");
            console.error(err);
        })

        console.log("publish success");
        scope.rtc.published = true
    }

    addView(id, show) {
        if (!$("#" + id)[0]) {
            $("<div/>", {
                id: "remote_video_panel_" + id,
                class: "video-view",
            }).appendTo("#video");

            $("<div/>", {
                id: "remote_video_" + id,
                class: "video-placeholder",
            }).appendTo("#remote_video_panel_" + id);

            $("<div/>", {
                id: "remote_video_info_" + id,
                class: "video-profile " + (show ? "" :  "hide"),
            }).appendTo("#remote_video_panel_" + id);

            $("<div/>", {
                id: "video_autoplay_"+ id,
                class: "autoplay-fallback hide",
            }).appendTo("#remote_video_panel_" + id);
        }
    }

}
