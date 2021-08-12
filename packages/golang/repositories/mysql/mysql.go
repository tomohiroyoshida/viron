package mysql

import (
	"strings"

	"github.com/cam-inc/viron/packages/golang/constant"
	"github.com/volatiletech/sqlboiler/v4/queries/qm"
)

type (
	Pager struct {
		Limit  int
		Offset int
	}
)

func GetPager(size int, page int) *Pager {

	if size == 0 {
		size = constant.DEFAULT_PAGER_SIZE
	}
	if page == 0 {
		page = constant.DEFAULT_PAGER_PAGE
	}

	return &Pager{
		Limit:  size,
		Offset: (page - 1) * size,
	}
}

func GetOrderBy(sort []string) qm.QueryMod {
	if len(sort) > 0 {
		orderBy := strings.Join(sort, ",")
		return qm.OrderBy(orderBy)
	}
	return nil
}