import json

import pytest


@pytest.mark.parametrize("weight", [100.5, -1, 4_294_967_296])
def test_lift_weight_rejects_fractional_or_out_of_range_values(signed_in_client, weight):
    lifts = [{"exercise_name": "Bench Press", "weight": weight, "unit": "kg", "reps": 1}]
    response = signed_in_client.post("/api/posts", data={"lifts": json.dumps(lifts)})
    assert response.status_code == 422


def test_lift_weight_accepts_uint32_max(signed_in_client):
    lifts = [{"exercise_name": "Bench Press", "weight": 4_294_967_295, "unit": "kg", "reps": 1}]
    response = signed_in_client.post("/api/posts", data={"lifts": json.dumps(lifts)})
    assert response.status_code == 201
    assert response.json()["lifts"][0]["weight"] == 4_294_967_295


def test_create_and_retrieve_post_with_media_and_lift(signed_in_client):
    lifts = [{"exercise_name": "Bench Press", "weight": 100, "unit": "kg", "reps": 1}]
    response = signed_in_client.post(
        "/api/posts",
        data={"caption": "Solid session", "lifts": json.dumps(lifts)},
        files={"media": ("bench.png", b"image-data", "image/png")},
    )
    assert response.status_code == 201
    post = response.json()
    assert post["caption"] == "Solid session"
    assert post["lifts"][0]["exercise_name"] == "Bench Press"
    assert post["media"][0]["media_type"] == "image"

    feed = signed_in_client.get("/api/posts").json()
    assert feed[0]["id"] == post["id"]
    assert signed_in_client.get(f"/api/posts/{post['id']}").json()["user"]["username"] == "alex"
    assert signed_in_client.get("/api/users/alex").json()["post_count"] == 1
    assert signed_in_client.get("/api/users/alex/posts").json()[0]["id"] == post["id"]


def test_post_requires_a_lift(signed_in_client):
    response = signed_in_client.post("/api/posts", data={"caption": "No lift", "lifts": "[]"})
    assert response.status_code == 422


def test_user_can_delete_own_post(signed_in_client):
    response = signed_in_client.post(
        "/api/posts",
        data={"lifts": '[{"exercise_name":"Squat","weight":80,"unit":"kg","reps":5}]'},
    )
    post_id = response.json()["id"]
    assert signed_in_client.delete(f"/api/posts/{post_id}").status_code == 204
    assert signed_in_client.get(f"/api/posts/{post_id}").status_code == 404


def test_user_can_comment_on_post_and_comments_are_in_post_responses(signed_in_client):
    response = signed_in_client.post(
        "/api/posts",
        data={"lifts": '[{"exercise_name":"Squat","weight":80,"unit":"kg","reps":5}]'},
    )
    post_id = response.json()["id"]

    comment_response = signed_in_client.post(
        f"/api/posts/{post_id}/comments",
        json={"body": "  Strong session!  "},
    )

    assert comment_response.status_code == 201
    assert comment_response.json()["body"] == "Strong session!"
    assert comment_response.json()["user"]["username"] == "alex"
    assert signed_in_client.get(f"/api/posts/{post_id}").json()["comments"][0]["id"] == comment_response.json()["id"]


def test_comment_rejects_empty_body(signed_in_client):
    response = signed_in_client.post("/api/posts/1/comments", json={"body": "   "})
    assert response.status_code == 422


def test_user_can_toggle_one_emoji_reaction_per_post(signed_in_client):
    response = signed_in_client.post(
        "/api/posts",
        data={"lifts": '[{"exercise_name":"Squat","weight":80,"unit":"kg","reps":5}]'},
    )
    post_id = response.json()["id"]

    reaction_response = signed_in_client.post(f"/api/posts/{post_id}/reaction", json={"emoji": "🔥"})
    assert reaction_response.status_code == 200
    assert [reaction["emoji"] for reaction in reaction_response.json()["reactions"]] == ["🔥"]

    switched_response = signed_in_client.post(f"/api/posts/{post_id}/reaction", json={"emoji": "💪"})
    assert [reaction["emoji"] for reaction in switched_response.json()["reactions"]] == ["💪"]
    assert signed_in_client.get(f"/api/posts/{post_id}").json()["reactions"][0]["emoji"] == "💪"

    removed_response = signed_in_client.post(f"/api/posts/{post_id}/reaction", json={"emoji": "💪"})
    assert removed_response.json()["reactions"] == []


def test_reaction_rejects_unknown_emoji(signed_in_client):
    response = signed_in_client.post("/api/posts/1/reaction", json={"emoji": "👍"})
    assert response.status_code == 422