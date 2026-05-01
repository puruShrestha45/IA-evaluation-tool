class DescribeListDatasets:
    def it_should_return_only_allowed_datasets(self, client):
        response = client.get("/api/datasets")
        assert response.status_code == 200
        assert len(response.json()) == 2

    def it_should_include_required_fields_per_dataset(self, client):
        dataset = client.get("/api/datasets").json()[0]
        for field in ("index", "candidate_name", "job_name", "interviewer_name", "pdf_available"):
            assert field in dataset

    def it_should_not_include_records_outside_allowed_ids(self, client):
        names = [d["candidate_name"] for d in client.get("/api/datasets").json()]
        assert "Excluded Candidate" not in names

    def it_should_assign_sequential_zero_based_indices(self, client):
        indices = [d["index"] for d in client.get("/api/datasets").json()]
        assert indices == list(range(len(indices)))


class DescribeGetDataset:
    def it_should_return_dataset_at_a_valid_index(self, client):
        response = client.get("/api/datasets/0")
        assert response.status_code == 200
        assert response.json()["interviewee_name"] == "Alice Smith"

    def it_should_return_second_dataset_at_index_1(self, client):
        response = client.get("/api/datasets/1")
        assert response.status_code == 200
        assert response.json()["interviewee_name"] == "Carlos Rivera"

    def it_should_return_404_when_index_is_out_of_range(self, client):
        assert client.get("/api/datasets/999").status_code == 404

    def it_should_include_pdf_available_flag_in_response(self, client):
        assert "pdf_available" in client.get("/api/datasets/0").json()

    def it_should_mark_pdf_as_unavailable_when_paths_are_empty(self, client):
        assert client.get("/api/datasets/0").json()["pdf_available"] is False
