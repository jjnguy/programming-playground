
export let defaultCode = {
    steps: [
        {
            type: "repeat",
            times: 80,
            steps: [
                {
                    type: "draw",
                    value: 16,
                    brush: {
                        color: "#000000",
                        width: 2,
                    },
                },
                {
                    type: "rotate",
                    value: 5,
                },
                {
                    type: "text",
                    value: "😊",
                    fontSize: 10,
                },
            ],
        },
    ],
    functions: [],
}