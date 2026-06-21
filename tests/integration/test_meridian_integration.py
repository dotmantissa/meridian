from gltest import get_contract_factory
from gltest.assertions import tx_execution_succeeded

def test_meridian_integration_flow():
    # Deploy contract
    factory = get_contract_factory("MeridianContract")
    contract = factory.deploy(args=[])

    # Call analyze_offer which does consensus
    tx_receipt = contract.analyze_offer(args=[
        "offer_integration_1",
        "Staff Software Engineer",
        "Meta",
        "New York",
        8,
        180000
    ]).transact()
    
    # Assert transaction executed successfully
    assert tx_execution_succeeded(tx_receipt)

    # Fetch result
    result = contract.get_analysis(args=["offer_integration_1"]).call()
    assert result["offer_id"] == "offer_integration_1"
    assert result["role"] == "Staff Software Engineer"
    assert result["company"] == "Meta"
    assert result["city"] == "New York"
    assert result["experience_years"] == 8
    assert result["offered_base"] == 180000
    assert result["market_min"] > 0
    assert result["market_max"] > 0
    assert result["market_median"] > 0
    assert result["recommended_base"] > 0
    assert result["equity_rating"] in ["excellent", "standard", "below_market", "risky"]
    assert len(result["equity_advice"]) > 0
    assert len(result["negotiation_points"]) > 0
