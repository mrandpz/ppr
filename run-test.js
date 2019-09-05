const puppeteer = require("puppeteer");

const jt = "655d0d00-55ce-468e-8ffe-c2938696c45b-1567662502036";

async function getDetail(browser, page) {
  const selector = await page.$$(
    "a[href^='/admin/commodity-manage/manage-detail']"
  );

  // a链接循环获取页面
  for (var i = 0; i < selector.length; i++) {
    pageA = await browser.newPage();

    const href = await page.evaluate(attr => attr.href, selector[i]);
    await selector[i].dispose();
    await pageA.setExtraHTTPHeaders({
      jt
    });
    await pageA.goto(href);
    await pageA.waitFor(1000);
    const url = href.replace(
      /http:\/\/localhost:8000\/admin\/commodity-manage\/manage\-detail\?/,
      ""
    );
    await pageA.screenshot({
      path: `./temp/${url}.png`
    });
    pageA.close();
  }
}

// 不断的跳转到下一页并且获得内容
async function loop(browser, page) {
  const nextPage = await page.$("li.ant-pagination-next");
  let hasNext = await page.evaluate(
    attr => attr.getAttribute("aria-disabled"),
    nextPage
  );
  await page.click("li.ant-pagination-next");
  await page.waitFor(2000);
  await getDetail(browser, page);
  await page.waitFor(2000);
  await loop(browser, page);
}

function start() {
  return (async () => {
    const browser = await puppeteer.launch({
      headless: true,
      defaultViewport: {
        width: 1200,
        height: 800
      }
    });
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      jt
    });
    // 第一次会跳到无权限页面
    await page.goto("http://localhost:8000/admin/commodity-manage/manage-list");
    // 第二次才会跳到正确的页面
    await page.goto("http://localhost:8000/admin/commodity-manage/manage-list");

    // 点击下拉框，选择了一个条件，才能执行搜索
    await page.click("#isSale");
    // 选中全部
    await page.click('li[role="option"]');

    // 点击搜索
    await page.click('button[type="submit"]');
    // 等待两秒
    await page.waitFor(2000);

    // 获取要跳转的a链接
    await getDetail(browser, page);

    // 循环点击
    await loop(browser, page);
  })();
}

start();
