import json
import pytest

def test_analyze_offer_flow(direct_vm, direct_deploy, direct_alice):
    # Deploy contract
    contract = direct_deploy("contracts/meridian_contract.py")
    direct_vm.sender = direct_alice

    # Setup LLM mock
    mock_response = {
        "market_min": 100000,
        "market_max": 150000,
        "market_median": 125000,
        "recommended_base": 135000,
        "equity_rating": "standard",
        "equity_advice": "Vesting is standard 1-year cliff, 4-year monthly.",
        "negotiation_points": "- Mention market median is higher.\n- Highlight unique experience."
    }
    
    # Mock LLM prompt execution
    direct_vm.mock_llm(
        r".*You are a senior executive recruiter.*",
        json.dumps(mock_response)
    )

    # Call analyze_offer
    offer_id = "offer_1"
    contract.analyze_offer(
        offer_id,
        "Senior Software Engineer",
        "Google",
        "San Francisco",
        5,
        110000
    )

    # Get analysis and assert
    result = contract.get_analysis(offer_id)
    assert result["offer_id"] == offer_id
    assert result["role"] == "Senior Software Engineer"
    assert result["company"] == "Google"
    assert result["city"] == "San Francisco"
    assert result["experience_years"] == 5
    assert result["offered_base"] == 110000
    assert result["market_min"] == 100000
    assert result["market_max"] == 150000
    assert result["market_median"] == 125000
    assert result["recommended_base"] == 135000
    assert result["equity_rating"] == "standard"
    assert "Vesting is standard" in result["equity_advice"]
    assert "Mention market median" in result["negotiation_points"]
