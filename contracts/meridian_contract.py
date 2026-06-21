# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
from dataclasses import dataclass
import json

@allow_storage
@dataclass
class OfferAnalysis:
    offer_id: str
    role: str
    company: str
    city: str
    experience_years: u256
    offered_base: u256
    market_min: u256
    market_max: u256
    market_median: u256
    recommended_base: u256
    equity_rating: str
    equity_advice: str
    negotiation_points: str

class MeridianContract(gl.Contract):
    owner: Address
    analyses: TreeMap[str, OfferAnalysis]

    def __init__(self):
        self.owner = gl.message.sender_address

    @gl.public.view
    def get_analysis(self, offer_id: str) -> dict:
        analysis = self.analyses[offer_id]
        return {
            "offer_id": analysis.offer_id,
            "role": analysis.role,
            "company": analysis.company,
            "city": analysis.city,
            "experience_years": int(analysis.experience_years),
            "offered_base": int(analysis.offered_base),
            "market_min": int(analysis.market_min),
            "market_max": int(analysis.market_max),
            "market_median": int(analysis.market_median),
            "recommended_base": int(analysis.recommended_base),
            "equity_rating": analysis.equity_rating,
            "equity_advice": analysis.equity_advice,
            "negotiation_points": analysis.negotiation_points
        }

    @gl.public.write
    def analyze_offer(self, offer_id: str, role: str, company: str, city: str, exp_years: int, base_salary: int) -> None:
        def leader_fn():
            prompt = f"""
            You are a senior executive recruiter and compensation expert. Analyze this job offer:
            Role: {role}
            Company: {company}
            City: {city}
            Years of Experience: {exp_years}
            Offered Base Salary: {base_salary}

            Your task:
            1. Determine the market salary range (min, max, median) for this specific role, location, and experience.
            2. Compute a recommended base salary that the candidate should push back for.
            3. Evaluate if the offer is standard or a trap.
            4. Provide 3 specific, highly customized negotiation points/talking scripts. Make them sound human, persuasive, and free of generic HR template language.

            You MUST return a JSON object with these exact keys:
            - "market_min": integer (minimum base salary in local currency)
            - "market_max": integer (maximum base salary in local currency)
            - "market_median": integer (median base salary in local currency)
            - "recommended_base": integer (target base salary to request)
            - "equity_rating": string (must be "excellent", "standard", "below_market", or "risky")
            - "equity_advice": string (clear analysis of equity terms and warnings about vesting/liquidation)
            - "negotiation_points": string (custom bulleted talking points)
            """
            result = gl.nondet.exec_prompt(prompt, response_format="json")
            
            # Defensive parsing
            if not isinstance(result, dict):
                raise gl.vm.UserError("[LLM_ERROR] LLM returned non-dict")
            
            # Standardize numeric values
            for k in ["market_min", "market_max", "market_median", "recommended_base"]:
                val = result.get(k)
                if val is None:
                    raise gl.vm.UserError(f"[LLM_ERROR] Missing key {k}")
                try:
                    result[k] = int(float(str(val).replace(",", "").strip()))
                except Exception:
                    raise gl.vm.UserError(f"[LLM_ERROR] Invalid numeric key {k}: {val}")
            
            # Ensure rating is valid
            rating = str(result.get("equity_rating", "")).strip().lower()
            if rating not in ["excellent", "standard", "below_market", "risky"]:
                result["equity_rating"] = "standard"
            else:
                result["equity_rating"] = rating
                
            return result

        def validator_fn(leaders_res: gl.vm.Result) -> bool:
            if not isinstance(leaders_res, gl.vm.Return):
                return False
            
            leader_data = leaders_res.calldata
            val_data = leader_fn()
            
            def approx_equal(a, b, pct=0.20):
                if a == 0 or b == 0:
                    return a == b
                return abs(a - b) / max(a, b) <= pct

            # Check core numeric ranges match within 20% tolerance to bypass minor model fluctuations
            m_min_ok = approx_equal(int(leader_data["market_min"]), int(val_data["market_min"]))
            m_max_ok = approx_equal(int(leader_data["market_max"]), int(val_data["market_max"]))
            m_med_ok = approx_equal(int(leader_data["market_median"]), int(val_data["market_median"]))
            rec_ok = approx_equal(int(leader_data["recommended_base"]), int(val_data["recommended_base"]))
            
            # Validate that the equity rating is valid
            eq_ok = leader_data["equity_rating"] in ["excellent", "standard", "below_market", "risky"]
            
            return m_min_ok and m_max_ok and m_med_ok and rec_ok and eq_ok

        res = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        
        self.analyses[offer_id] = OfferAnalysis(
            offer_id=offer_id,
            role=role,
            company=company,
            city=city,
            experience_years=u256(exp_years),
            offered_base=u256(base_salary),
            market_min=u256(int(res["market_min"])),
            market_max=u256(int(res["market_max"])),
            market_median=u256(int(res["market_median"])),
            recommended_base=u256(int(res["recommended_base"])),
            equity_rating=res["equity_rating"],
            equity_advice=res.get("equity_advice", "No equity details provided."),
            negotiation_points=res.get("negotiation_points", "Ask for a higher base based on market research.")
        )
