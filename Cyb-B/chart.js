    {
        name: "Cyberia B-Side",
        notes: {
            [1000]: [
                {
                    Lane: 2,
                    Speed: 0.9
                }
            ],
            [1450]: [
                {
                    Lane: 4,
                    Speed: 1
                }
            ],
            [1650]: [
                {
                    Lane: 3,
                    Speed: 0.85,
                    ID: "hit1"
                }
            ],
            [1800]: [
                {
                    Lane: 3,
                    Speed: 0.85,
                    ID: "invis1"
                }
            ],
            [1950]: [
                {
                    Lane: 3,
                    Speed: 0.85,
                    ID: "invis2"
                }
            ],
            [2150]: [
                {
                    Lane: 1,
                    Speed: 1
                }
            ],
            [2700]: [
                {
                    Lane: 1,
                    Speed: 1
                }
            ],
            [3200]: [
                {
                    Lane: 4,
                    Speed: 1
                }
            ]
            
        },
        song: ghProxy+"Cyb-B/song.mp3",
        cover: ghProxy+"Cyb-B/cover.png",
        artist: "Nicopatty",
        author: "gingerphoenix10",
        modchart: {
            [0]: [
                {
                    type: "runOnSpawn",
                    id: "invis1",
                    events: [
                        {
                            type: "SetStyle",
                            id: "invis1",
                            style: "outline",
                            value: "#888 dashed 2px"
                        },
                        {
                            type: "SetStyle",
                            id: "invis1",
                            style: "background-color",
                            value: "#111"
                        }
                    ]
                },

                {
                    type: "runOnSpawn",
                    id: "invis2",
                    events: [
                        {
                            type: "SetStyle",
                            id: "invis2",
                            style: "outline",
                            value: "#888 dashed 2px"
                        },
                        {
                            type: "SetStyle",
                            id: "invis2",
                            style: "background-color",
                            value: "#111"
                        }
                    ]
                },
                {
                    type: "runOnDestroy",
                    id: "hit1",
                    events: [
                        {
                            type: "SetStyle",
                            id: "invis1",
                            style: "background-color",
                            value: "#fff"
                        }
                    ]
                },
                {
                    type: "runOnDestroy",
                    id: "invis1",
                    events: [
                        {
                            type: "SetStyle",
                            id: "invis2",
                            style: "background-color",
                            value: "#fff"
                        }
                    ]
                },
                /*{
                    type: "SetStyle",
                    id: "static3",
                    style: "top",
                    value: "50%"
                }*/
            ]
        }
    }
