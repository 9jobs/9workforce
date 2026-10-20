const assetPathPrefix = "https://www.figma.com/api/mcp/asset/c6bdbcee-e82e-48b7-9a88-ed74aebc8c95";
const imgContainer = `${assetPathPrefix}/f8033.svg`;

export default function Background() {
  return (
    <div className="bg-[#eff3f9] content-stretch flex items-center justify-between p-[8px] relative rounded-[12px] size-full" data-node-id="8:3324" data-name="Background">
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="8:3325" data-name="Container">
        <div className="bg-[#e5eeff] content-stretch flex items-center justify-center relative rounded-[8px] shrink-0 size-[32px]" data-node-id="8:3326" data-name="Background">
          <div className="h-[15px] relative shrink-0 w-[12px]" data-node-id="8:3327" data-name="Container">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgContainer} />
          </div>
        </div>
        <div className="content-center flex flex-wrap gap-[4px_8px] items-center relative shrink-0" data-node-id="8:3329" data-name="Container">
          <div className="content-stretch flex flex-col items-start relative shrink-0" data-node-id="8:3330" data-name="Container">
            <div className="[word-break:break-word] flex flex-col font-['Inter:Bold'] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#163265] text-[12px] tracking-[0.24px] whitespace-nowrap" data-node-id="8:3331">
              <p className="leading-[16px]">Authorised Internal Staff View Only</p>
            </div>
          </div>
          <div className="content-stretch flex flex-col items-start relative shrink-0" data-node-id="8:3332" data-name="Container">
            <div className="[word-break:break-word] flex flex-col font-['Inter:Bold'] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#64748b] text-[12px] whitespace-nowrap" data-node-id="8:3333">
              <p className="leading-[18px]">•</p>
            </div>
          </div>
          <div className="content-stretch flex flex-col items-start relative shrink-0" data-node-id="8:3334" data-name="Container">
            <div className="[word-break:break-word] flex flex-col font-['Inter:Regular'] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#64748b] text-[12px] whitespace-nowrap" data-node-id="8:3335">
              <p className="leading-[16px]">{`Strict Privacy & Victorian Labour Hire Licensing Act (Vic) 2018 Protected`}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-node-id="8:3336" data-name="Container">
        <div className="bg-[#10b981] relative rounded-[9999px] shrink-0 size-[8px]" data-node-id="8:3337" data-name="Background" />
        <div className="content-stretch flex flex-col items-start relative shrink-0" data-node-id="8:3338" data-name="Container">
          <div className="[word-break:break-word] flex flex-col font-['Inter:Bold'] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#64748b] text-[11px] tracking-[0.55px] uppercase whitespace-nowrap" data-node-id="8:3339">
            <p className="leading-[14px]">SYNC: LIVE VIC REGISTRY</p>
          </div>
        </div>
      </div>
    </div>
  );
}
