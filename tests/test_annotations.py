EMAIL = "reviewer@fusemachines.com"
ANN_DATA = {"jd_parsing": {"must_haves": 4, "completeness": 3}}


class DescribeGetAnnotations:
    def it_should_return_empty_dict_when_no_annotation_exists(self, client):
        response = client.get("/api/annotations/0", params={"email": EMAIL})
        assert response.status_code == 200
        assert response.json() == {}

    def it_should_return_empty_dict_for_a_different_email_than_saved(self, client):
        client.post("/api/annotations/0", json={"email": EMAIL, "data": ANN_DATA})
        response = client.get("/api/annotations/0", params={"email": "other@fusemachines.com"})
        assert response.json() == {}


class DescribePostAnnotations:
    def it_should_save_annotation_and_return_ok(self, client):
        response = client.post("/api/annotations/0", json={"email": EMAIL, "data": ANN_DATA})
        assert response.status_code == 200
        assert response.json()["ok"] is True

    def it_should_return_saved_annotation_on_subsequent_get(self, client):
        client.post("/api/annotations/0", json={"email": EMAIL, "data": ANN_DATA})
        assert client.get("/api/annotations/0", params={"email": EMAIL}).json() == ANN_DATA

    def it_should_upsert_when_annotation_already_exists(self, client):
        client.post("/api/annotations/0", json={"email": EMAIL, "data": {"v": 1}})
        client.post("/api/annotations/0", json={"email": EMAIL, "data": {"v": 2}})
        assert client.get("/api/annotations/0", params={"email": EMAIL}).json()["v"] == 2

    def it_should_keep_annotations_isolated_per_dataset_index(self, client):
        client.post("/api/annotations/0", json={"email": EMAIL, "data": {"idx": 0}})
        client.post("/api/annotations/1", json={"email": EMAIL, "data": {"idx": 1}})
        assert client.get("/api/annotations/0", params={"email": EMAIL}).json()["idx"] == 0
        assert client.get("/api/annotations/1", params={"email": EMAIL}).json()["idx"] == 1

    def it_should_return_400_when_email_is_missing_from_body(self, client):
        assert client.post("/api/annotations/0", json={"data": ANN_DATA}).status_code == 400


class DescribeDeleteAnnotations:
    def it_should_delete_an_existing_annotation(self, client):
        client.post("/api/annotations/0", json={"email": EMAIL, "data": ANN_DATA})
        client.delete("/api/annotations/0", params={"email": EMAIL})
        assert client.get("/api/annotations/0", params={"email": EMAIL}).json() == {}

    def it_should_return_ok_even_when_annotation_does_not_exist(self, client):
        response = client.delete("/api/annotations/0", params={"email": EMAIL})
        assert response.status_code == 200
        assert response.json()["ok"] is True

    def it_should_not_delete_annotation_belonging_to_a_different_email(self, client):
        client.post("/api/annotations/0", json={"email": EMAIL, "data": ANN_DATA})
        client.delete("/api/annotations/0", params={"email": "other@fusemachines.com"})
        assert client.get("/api/annotations/0", params={"email": EMAIL}).json() == ANN_DATA
