def test_user_can_create_goal_with_milestones_and_progress(signed_in_client):
    response = signed_in_client.post(
        "/api/goals",
        json={
            "title": "Read 12 books",
            "description": "Make time for fiction and history.",
            "category": "Learning",
            "progress_enabled": True,
            "current_value": 2,
            "target_value": 12,
            "unit": "books",
            "milestones": [{"title": "Choose the first book"}, {"title": "Finish book three"}],
        },
    )
    assert response.status_code == 201
    goal = response.json()
    assert goal["title"] == "Read 12 books"
    assert goal["milestones"][0]["title"] == "Choose the first book"

    listed = signed_in_client.get("/api/goals")
    assert listed.status_code == 200
    assert listed.json()[0]["current_value"] == 2


def test_goal_progress_milestone_and_update(signed_in_client):
    goal = signed_in_client.post(
        "/api/goals",
        json={"title": "Run a 5K", "progress_enabled": True, "target_value": 5, "unit": "km", "milestones": [{"title": "Run 2 km"}]},
    ).json()
    goal_id = goal["id"]
    milestone_id = goal["milestones"][0]["id"]

    progress = signed_in_client.patch(f"/api/goals/{goal_id}", json={"current_value": 2})
    assert progress.status_code == 200
    assert progress.json()["current_value"] == 2

    toggled = signed_in_client.patch(f"/api/goals/{goal_id}/milestones/{milestone_id}")
    assert toggled.json()["milestones"][0]["completed"] is True

    update = signed_in_client.post(f"/api/goals/{goal_id}/updates", json={"body": "Felt good today."})
    assert update.status_code == 201
    assert update.json()["body"] == "Felt good today."


def test_goal_requires_target_for_progress(signed_in_client):
    response = signed_in_client.post("/api/goals", json={"title": "Learn Spanish", "progress_enabled": True})
    assert response.status_code == 422
