type JSONLike = null | number | string | boolean

export type JSONObject = {
    [k: string]: JSONLike | JSONObject | (JSONLike | JSONObject)[]
}

export type JSONType = JSONObject | (JSONLike | JSONObject)[]