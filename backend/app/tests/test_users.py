def test_profile_and_user_posts(signed_in_client):
    profile = signed_in_client.get("/api/users/alex")
    assert profile.status_code == 200
    assert profile.json()["username"] == "alex"
    assert profile.json()["post_count"] == 0
    assert signed_in_client.get("/api/users/missing").status_code == 404
    assert signed_in_client.get("/api/users/alex/posts").json() == []