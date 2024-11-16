import { chromium } from "playwright"

const RealLevelData = async () => {
	const url = "https://sgimera.github.io/mai_RatingAnalyzer/maidx_inner_level_23_prism.html"
	const browser = await chromium.launch()
	const page = await browser.newPage()

	console.log("access to external page...")

	await page.goto(url)
	const not_eval_list = await page.$(".not_eval_list")
	const evaluated_list = await page.$(".evaluated_list")
	return (
		<>
			<table dangerouslySetInnerHTML={{ __html: await not_eval_list?.innerHTML() ?? "" }}></table>
			<table dangerouslySetInnerHTML={{ __html: await evaluated_list?.innerHTML() ?? "" }}></table>
		</>
	)

}
export default RealLevelData